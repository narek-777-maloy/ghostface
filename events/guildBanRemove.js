const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../utils/webhookLogger');

module.exports = {
  name: 'guildBanRemove',
  async execute(ban, config) {
    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('🔓 Пользователь разбанен')
      .setDescription(`**${ban.user.tag}**`)
      .setThumbnail(ban.user.displayAvatarURL())
      .setTimestamp();

    sendLog(ban.client, config.logChannelId, embed);
  }
};
