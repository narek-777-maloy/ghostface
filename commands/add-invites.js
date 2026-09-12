const { SlashCommandBuilder } = require('discord.js');
const db = require('../database');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add-invites')
    .setDescription('[Админ] Добавить/отнять инвайты пользователю вручную')
    .addUserOption(opt => opt.setName('пользователь').setDescription('Кому').setRequired(true))
    .addIntegerOption(opt => opt.setName('количество').setDescription('Число (можно отрицательное)').setRequired(true)),

  async execute(interaction) {
    const member = interaction.member;
    const isAdmin =
      member.permissions.has('Administrator') ||
      config.adminRoleIds.some(id => member.roles.cache.has(id));

    if (!isAdmin) {
      return interaction.reply({ content: '⛔ У вас нет прав на эту команду.', ephemeral: true });
    }

    const user = interaction.options.getUser('пользователь');
    const amount = interaction.options.getInteger('количество');
    const total = db.addInvite(user.id, amount);

    await interaction.reply(`✅ Готово! У **${user.tag}** теперь **${total}** инвайт(ов).`);
  }
};
