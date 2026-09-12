const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tournament-close')
    .setDescription('[Админ] Закрыть запись на турнир')
    .addStringOption(opt => opt.setName('id_сообщения').setDescription('ID сообщения с турниром').setRequired(true)),

  async execute(interaction) {
    const member = interaction.member;
    const isAdmin =
      member.permissions.has('Administrator') ||
      config.adminRoleIds.some(id => member.roles.cache.has(id));

    if (!isAdmin) {
      return interaction.reply({ content: '⛔ У вас нет прав на эту команду.', ephemeral: true });
    }

    const messageId = interaction.options.getString('id_сообщения');
    const tournament = db.getTournament(messageId);

    if (!tournament) {
      return interaction.reply({ content: '⛔ Турнир с таким ID не найден.', ephemeral: true });
    }
    if (tournament.closed) {
      return interaction.reply({ content: '⛔ Запись уже закрыта.', ephemeral: true });
    }

    db.updateTournament(messageId, { closed: true });

    const channel = await interaction.client.channels.fetch(tournament.channelId).catch(() => null);
    if (channel) {
      const message = await channel.messages.fetch(messageId).catch(() => null);
      if (message && message.embeds[0]) {
        const newEmbed = EmbedBuilder.from(message.embeds[0])
          .setColor(0x99AAB5)
          .setFooter({ text: 'Запись закрыта' });

        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('tournament_join').setLabel('Запись закрыта').setEmoji('🔒').setStyle(ButtonStyle.Secondary).setDisabled(true)
        );

        await message.edit({ embeds: [newEmbed], components: [disabledRow] }).catch(() => {});
      }
    }

    await interaction.reply({ content: '✅ Запись на турнир закрыта.', ephemeral: true });
  }
};
