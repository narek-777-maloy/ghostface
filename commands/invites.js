const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invites')
    .setDescription('Посмотреть количество инвайтов пользователя')
    .addUserOption(opt =>
      opt.setName('пользователь')
        .setDescription('Чьи инвайты посмотреть (по умолчанию — ваши)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('пользователь') || interaction.user;
    const count = db.getInvites(user.id);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setDescription(`📨 У **${user.tag}** сейчас **${count}** приглашённых участников.`)
      .setThumbnail(user.displayAvatarURL());

    await interaction.reply({ embeds: [embed] });
  }
};
