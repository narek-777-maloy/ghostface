const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('top-invites')
    .setDescription('Показать топ участников по количеству приглашений'),

  async execute(interaction) {
    const invites = db.data.invites;
    const sorted = Object.entries(invites)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (!sorted.length) {
      return interaction.reply({ content: 'Пока никто никого не пригласил 🙁', ephemeral: true });
    }

    const medals = ['🥇', '🥈', '🥉'];
    const lines = sorted.map(([userId, count], i) => {
      const place = medals[i] || `**${i + 1}.**`;
      return `${place} <@${userId}> — **${count}** инвайт(ов)`;
    });

    const embed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setTitle('🏆 Топ инвайтеров сервера')
      .setDescription(lines.join('\n'))
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
