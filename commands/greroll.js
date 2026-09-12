const { SlashCommandBuilder } = require('discord.js');
const db = require('../database');
const config = require('../config.json');
const { pickWinners } = require('../utils/giveawayManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('greroll')
    .setDescription('[Админ] Перевыбрать победителя завершённого конкурса')
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
    if (!giveaway.ended) {
      return interaction.reply({ content: '⛔ Этот конкурс ещё не завершён.', ephemeral: true });
    }
    if (!giveaway.participants.length) {
      return interaction.reply({ content: '⛔ У этого конкурса не было участников.', ephemeral: true });
    }

    const newWinners = pickWinners(giveaway.participants, giveaway.winnersCount);
    db.updateGiveaway(messageId, { winners: newWinners });

    const channel = await interaction.client.channels.fetch(giveaway.channelId).catch(() => null);
    if (channel) {
      channel.send(
        `🔄 Новый розыгрыш! Победитель(и) на приз **${giveaway.prize}**: ${newWinners.map(id => `<@${id}>`).join(', ')}`
      ).catch(() => {});
    }

    await interaction.reply({ content: '✅ Победители перевыбраны.', ephemeral: true });
  }
};
