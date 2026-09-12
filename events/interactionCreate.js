const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
const db = require('../database');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, config) {
    // ---------- СЛЭШ-КОМАНДЫ ----------
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(err);
        const payload = { content: '⛔ Произошла ошибка при выполнении команды.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(payload).catch(() => {});
        } else {
          await interaction.reply(payload).catch(() => {});
        }
      }
      return;
    }

    // ---------- КНОПКА "УЧАСТВОВАТЬ" В КОНКУРСЕ ----------
    if (interaction.isButton() && interaction.customId === 'giveaway_join') {
      const giveaway = db.getGiveaway(interaction.message.id);
      if (!giveaway || giveaway.ended) {
        return interaction.reply({ content: '⛔ Этот конкурс уже завершён.', ephemeral: true });
      }
      if (giveaway.participants.includes(interaction.user.id)) {
        return interaction.reply({ content: 'Вы уже участвуете в этом конкурсе! ✅', ephemeral: true });
      }
      giveaway.participants.push(interaction.user.id);
      db.updateGiveaway(interaction.message.id, { participants: giveaway.participants });
      return interaction.reply({ content: '🎉 Вы участвуете в конкурсе! Удачи!', ephemeral: true });
    }

    // ---------- КНОПКА "ЗАПИСАТЬСЯ" НА ТУРНИР ----------
    if (interaction.isButton() && interaction.customId === 'tournament_join') {
      const tournament = db.getTournament(interaction.message.id);

      if (!tournament || tournament.closed) {
        return interaction.reply({ content: '⛔ Запись на этот турнир закрыта.', ephemeral: true });
      }
      if (tournament.participants.some(p => p.userId === interaction.user.id)) {
        return interaction.reply({ content: 'Вы уже записаны на этот турнир! ✅', ephemeral: true });
      }
      if (tournament.maxParticipants && tournament.participants.length >= tournament.maxParticipants) {
        return interaction.reply({ content: '⛔ Свободных мест больше нет.', ephemeral: true });
      }

      const modal = new ModalBuilder()
        .setCustomId(`modal_tournament_${interaction.message.id}`)
        .setTitle('Запись на турнир');

      const nickInput = new TextInputBuilder()
        .setCustomId('field_nick')
        .setLabel('Игровой ник')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const serverInput = new TextInputBuilder()
        .setCustomId('field_server')
        .setLabel('ID персонажа / сервер')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nickInput),
        new ActionRowBuilder().addComponents(serverInput)
      );

      return interaction.showModal(modal);
    }

    // ---------- ОТПРАВКА ФОРМЫ ЗАПИСИ НА ТУРНИР ----------
    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_tournament_')) {
      const messageId = interaction.customId.replace('modal_tournament_', '');
      const tournament = db.getTournament(messageId);

      if (!tournament || tournament.closed) {
        return interaction.reply({ content: '⛔ Запись на этот турнир уже закрыта.', ephemeral: true });
      }
      if (tournament.participants.some(p => p.userId === interaction.user.id)) {
        return interaction.reply({ content: 'Вы уже записаны на этот турнир! ✅', ephemeral: true });
      }
      if (tournament.maxParticipants && tournament.participants.length >= tournament.maxParticipants) {
        return interaction.reply({ content: '⛔ Свободных мест больше нет.', ephemeral: true });
      }

      const nickname = interaction.fields.getTextInputValue('field_nick');
      const serverInfo = interaction.fields.getTextInputValue('field_server');

      tournament.participants.push({ userId: interaction.user.id, nickname, serverInfo });
      db.updateTournament(messageId, { participants: tournament.participants });

      const channel = await interaction.client.channels.fetch(tournament.channelId).catch(() => null);
      if (channel) {
        const message = await channel.messages.fetch(messageId).catch(() => null);
        if (message && message.embeds[0]) {
          const newDescription =
            `${tournament.description}\n\n👥 Записалось: **${tournament.participants.length}**` +
            `${tournament.maxParticipants ? `/${tournament.maxParticipants}` : ''}`;
          const newEmbed = EmbedBuilder.from(message.embeds[0]).setDescription(newDescription);
          message.edit({ embeds: [newEmbed] }).catch(() => {});
        }
      }

      await interaction.reply({ content: '✅ Вы записаны на турнир! Удачи!', ephemeral: true });
      return;
    }

    // ---------- КНОПКИ ОТКРЫТИЯ ФОРМ ЗАЯВОК ----------
    if (interaction.isButton() && (interaction.customId === 'apply_staff' || interaction.customId === 'apply_media')) {
      const isStaff = interaction.customId === 'apply_staff';

      const modal = new ModalBuilder()
        .setCustomId(isStaff ? 'modal_apply_staff' : 'modal_apply_media')
        .setTitle(isStaff ? 'Заявка на Стафф' : 'Заявка на Медиа');

      const nameInput = new TextInputBuilder()
        .setCustomId('field_name')
        .setLabel('Ваше имя/ник и возраст')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const experienceInput = new TextInputBuilder()
        .setCustomId('field_experience')
        .setLabel(isStaff ? 'Опыт модерации / на серверах' : 'Опыт создания контента / ссылки')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const timeInput = new TextInputBuilder()
        .setCustomId('field_time')
        .setLabel('Сколько времени готовы уделять?')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const whyInput = new TextInputBuilder()
        .setCustomId('field_why')
        .setLabel(isStaff ? 'Почему хотите попасть в стафф?' : 'Почему хотите быть медиа?')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(experienceInput),
        new ActionRowBuilder().addComponents(timeInput),
        new ActionRowBuilder().addComponents(whyInput)
      );

      return interaction.showModal(modal);
    }

    // ---------- ОТПРАВКА ФОРМЫ ----------
    if (interaction.isModalSubmit() && (interaction.customId === 'modal_apply_staff' || interaction.customId === 'modal_apply_media')) {
      const isStaff = interaction.customId === 'modal_apply_staff';
      const reviewChannelId = isStaff ? config.staffReviewChannelId : config.mediaReviewChannelId;
      const reviewChannel = interaction.guild.channels.cache.get(reviewChannelId);

      if (!reviewChannel) {
        return interaction.reply({ content: '⛔ Канал для рассмотрения заявок не настроен. Сообщите администрации.', ephemeral: true });
      }

      const name = interaction.fields.getTextInputValue('field_name');
      const experience = interaction.fields.getTextInputValue('field_experience');
      const time = interaction.fields.getTextInputValue('field_time');
      const why = interaction.fields.getTextInputValue('field_why');

      const embed = new EmbedBuilder()
        .setColor(isStaff ? 0x5865F2 : 0xEB459E)
        .setTitle(isStaff ? '🛠️ Новая заявка на Стафф' : '🎬 Новая заявка на Медиа')
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: 'Заявитель', value: `${interaction.user} (${interaction.user.tag})` },
          { name: 'Имя/возраст', value: name },
          { name: 'Опыт', value: experience },
          { name: 'Готовое время', value: time },
          { name: 'Почему хочет', value: why }
        )
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`accept_${interaction.user.id}`).setLabel('Принять').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`deny_${interaction.user.id}`).setLabel('Отклонить').setStyle(ButtonStyle.Danger)
      );

      await reviewChannel.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: '✅ Ваша заявка отправлена на рассмотрение!', ephemeral: true });
      return;
    }

    // ---------- ПРИНЯТЬ / ОТКЛОНИТЬ ЗАЯВКУ ----------
    if (interaction.isButton() && (interaction.customId.startsWith('accept_') || interaction.customId.startsWith('deny_'))) {
      const member = interaction.member;
      const isAdmin =
        member.permissions.has('Administrator') ||
        config.adminRoleIds.some(id => member.roles.cache.has(id));

      if (!isAdmin) {
        return interaction.reply({ content: '⛔ У вас нет прав рассматривать заявки.', ephemeral: true });
      }

      const isAccept = interaction.customId.startsWith('accept_');
      const applicantId = interaction.customId.split('_')[1];

      const oldEmbed = interaction.message.embeds[0];
      const newEmbed = EmbedBuilder.from(oldEmbed)
        .setColor(isAccept ? 0x57F287 : 0xED4245)
        .addFields({ name: 'Статус', value: `${isAccept ? '✅ Принята' : '❌ Отклонена'} — рассмотрел ${interaction.user.tag}` });

      await interaction.update({ embeds: [newEmbed], components: [] });

      const applicant = await interaction.client.users.fetch(applicantId).catch(() => null);
      if (applicant) {
        applicant.send(
          isAccept
            ? `🎉 Поздравляем! Ваша заявка на сервере **${interaction.guild.name}** была **принята**!`
            : `😔 К сожалению, ваша заявка на сервере **${interaction.guild.name}** была **отклонена**.`
        ).catch(() => {});
      }
      return;
    }
  }
};
