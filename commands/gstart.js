const { SlashCommandBuilder } = require('discord.js');
const db = require('../database');
const config = require('../config.json');
const { parseDuration } = require('../utils/duration');
const { buildGiveawayEmbed, buildGiveawayRow } = require('../utils/giveawayManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gstart')
    .setDescription('[Админ] Запустить конкурс')
    .addStringOption(opt =>
      opt.setName('время')
        .setDescription('Длительность: например 10m, 1h, 2d')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('победители')
        .setDescription('Количество победителей')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('приз')
        .setDescription('Что разыгрываем')
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName('канал')
        .setDescription('В каком канале запустить (по умолчанию — текущий)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const member = interaction.member;
    const isAdmin =
      member.permissions.has('Administrator') ||
      config.adminRoleIds.some(id => member.roles.cache.has(id));

    if (!isAdmin) {
      return interaction.reply({ content: '⛔ У вас нет прав на эту команду.', ephemeral: true });
    }

    const durationRaw = interaction.options.getString('время');
    const winnersCount = interaction.options.getInteger('победители');
    const prize = interaction.options.getString('приз');
    const channel = interaction.options.getChannel('канал') || interaction.channel;

    const durationMs = parseDuration(durationRaw);
    if (!durationMs) {
      return interaction.reply({
        content: '⛔ Неверный формат времени. Используй, например: `30s`, `10m`, `1h`, `2d`.',
        ephemeral: true
      });
    }
    if (winnersCount < 1) {
      return interaction.reply({ content: '⛔ Количество победителей должно быть от 1.', ephemeral: true });
    }

    const endAt = Date.now() + durationMs;

    const giveawayDraft = {
      channelId: channel.id,
      guildId: interaction.guild.id,
      hostId: interaction.user.id,
      prize,
      winnersCount,
      endAt,
      participants: [],
      ended: false,
      winners: []
    };

    const pingRole = config.giveawayPingRoleId ? `<@&${config.giveawayPingRoleId}> ` : '';

    const embed = buildGiveawayEmbed(giveawayDraft, false);
    const row = buildGiveawayRow(false);

    const message = await channel.send({ content: `${pingRole}🎉 **Новый конкурс!**`, embeds: [embed], components: [row] });

    db.createGiveaway(message.id, giveawayDraft);

    await interaction.reply({ content: `✅ Конкурс запущен в ${channel}!`, ephemeral: true });
  }
};
