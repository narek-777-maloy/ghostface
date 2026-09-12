const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../utils/webhookLogger');

module.exports = {
  name: 'messageDeleteBulk',
  async execute(messages, config) {
    const first = messages.first();
    if (!first || !first.guild) return;

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('🗑️ Массовое удаление сообщений')
      .setDescription(`Удалено **${messages.size}** сообщений в канале ${first.channel}`)
      .setTimestamp();

    sendLog(first.client, config.logChannelId, embed);
  }
};
