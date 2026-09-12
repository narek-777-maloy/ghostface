const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../utils/webhookLogger');

module.exports = {
  name: 'channelCreate',
  async execute(channel, config) {
    if (!channel.guild || channel.guild.id !== config.guildId) return;

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('📂 Канал создан')
      .setDescription(`${channel} (\`${channel.name}\`)`)
      .setTimestamp();

    sendLog(channel.client, config.logChannelId, embed);
  }
};
