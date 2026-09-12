const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tournament-list')
    .setDescription('[Админ] Список записавшихся на турнир')
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
    if (!tournament.participants.length) {
      return interaction.reply({ content: 'Пока никто не записался.', ephemeral: true });
    }

    const lines = tournament.participants.map((p, i) =>
      `**${i + 1}.** <@${p.userId}> — Ник: \`${p.nickname}\`, ID/сервер: \`${p.serverInfo}\``
    );

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`📋 Участники турнира: ${tournament.title}`)
      .setDescription(lines.join('\n').slice(0, 4000))
      .setFooter({ text: `Всего: ${tournament.participants.length}` });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
