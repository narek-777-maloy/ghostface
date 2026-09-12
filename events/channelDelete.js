const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../utils/webhookLogger');

module.exports = {
  name: 'channelDelete',
  async execute(channel, config) {
    if (!channel.guild || channel.guild.id !== config.guildId) return;

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('📂 Канал удалён')
      .setDescription(`\`#${channel.name}\``)
      .setTimestamp();

    sendLog(channel.client, config.logChannelId, embed);
  }
};
