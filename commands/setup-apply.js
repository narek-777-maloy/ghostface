const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-apply')
    .setDescription('[Админ] Опубликовать панель подачи заявок (стафф/медиа) в этом канале'),

  async execute(interaction) {
    const member = interaction.member;
    const isAdmin =
      member.permissions.has('Administrator') ||
      config.adminRoleIds.some(id => member.roles.cache.has(id));

    if (!isAdmin) {
      return interaction.reply({ content: '⛔ У вас нет прав на эту команду.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📋 Подача заявок — ghostface')
      .setDescription(
        'Хотите присоединиться к команде сервера или стать медиа-партнёром?\n\n' +
        '🛠️ **Стафф** — помощь в модерации и жизни сервера.\n' +
        '🎬 **Медиа** — создание контента про Anteyka / Grand Mobile.\n\n' +
        'Нажмите на нужную кнопку ниже и заполните форму.'
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('apply_staff').setLabel('Заявка на Стафф').setEmoji('🛠️').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('apply_media').setLabel('Заявка на Медиа').setEmoji('🎬').setStyle(ButtonStyle.Secondary)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ Панель заявок опубликована.', ephemeral: true });
  }
};
