const { SlashCommandBuilder } = require('discord.js');
const db = require('../database');
const config = require('../config.json');
const { endGiveaway } = require('../utils/giveawayManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gend')
    .setDescription('[Админ] Досрочно завершить конкурс')
    .addStringOption(opt =>
      opt.setName('id_сообщения')
        .setDescription('ID сообщения с конкурсом')
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.member;
    const isAdmin =
      member.permissions.has('Administrator') ||
      config.adminRoleIds.some(id => member.roles.cache.has(id));

    if (!isAdmin) {
      return interaction.reply({ content: '⛔ У вас нет прав на эту команду.', ephemeral: true });
    }

    const messageId = interaction.options.getString('id_сообщения');
    const giveaway = db.getGiveaway(messageId);

    if (!giveaway) {
      return interaction.reply({ content: '⛔ Конкурс с таким ID не найден.', ephemeral: true });
    }
    if (giveaway.ended) {
      return interaction.reply({ content: '⛔ Этот конкурс уже завершён.', ephemeral: true });
    }

    await endGiveaway(interaction.client, messageId);
    await interaction.reply({ content: '✅ Конкурс завершён досрочно.', ephemeral: true });
  }
};
