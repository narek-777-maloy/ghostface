const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tournament-start')
    .setDescription('[Админ] Открыть запись на турнир')
    .addStringOption(opt => opt.setName('название').setDescription('Название турнира').setRequired(true))
    .addStringOption(opt => opt.setName('описание').setDescription('Описание и правила турнира').setRequired(true))
    .addIntegerOption(opt => opt.setName('макс_участников').setDescription('Лимит участников (0 = без лимита)').setRequired(false))
    .addChannelOption(opt => opt.setName('канал').setDescription('Канал для публикации (по умолчанию — текущий)').setRequired(false)),

  async execute(interaction) {
    const member = interaction.member;
    const isAdmin =
      member.permissions.has('Administrator') ||
      config.adminRoleIds.some(id => member.roles.cache.has(id));

    if (!isAdmin) {
      return interaction.reply({ content: '⛔ У вас нет прав на эту команду.', ephemeral: true });
    }

    const title = interaction.options.getString('название');
    const description = interaction.options.getString('описание');
    const maxParticipants = interaction.options.getInteger('макс_участников') || 0;
    const channel = interaction.options.getChannel('канал') || interaction.channel;

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`🏆 Турнир: ${title}`)
      .setDescription(
        `${description}\n\n👥 Записалось: **0**${maxParticipants ? `/${maxParticipants}` : ''}`
      )
      .setFooter({ text: 'Нажмите кнопку ниже, чтобы записаться' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('tournament_join').setLabel('Записаться').setEmoji('📝').setStyle(ButtonStyle.Success)
    );

    const message = await channel.send({ embeds: [embed], components: [row] });

    db.createTournament(message.id, {
      channelId: channel.id,
      guildId: interaction.guild.id,
      hostId: interaction.user.id,
      title,
      description,
      maxParticipants,
      participants: [],
      closed: false
    });

    await interaction.reply({ content: `✅ Запись на турнир опубликована в ${channel}!`, ephemeral: true });
  }
};
