const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../utils/webhookLogger');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, config) {
    if (newState.guild.id !== config.guildId) return;
    const member = newState.member || oldState.member;
    if (!member) return;

    let description = null;

    if (!oldState.channelId && newState.channelId) {
      description = `🔊 ${member} зашёл(-ла) в голосовой канал ${newState.channel}`;
    } else if (oldState.channelId && !newState.channelId) {
      description = `🔈 ${member} вышел(-ла) из голосового канала ${oldState.channel}`;
    } else if (oldState.channelId !== newState.channelId) {
      description = `🔀 ${member} перешёл(-ла) из ${oldState.channel} в ${newState.channel}`;
    }

    if (!description) return;

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setDescription(description)
      .setTimestamp();

    sendLog(member.client, config.logChannelId, embed);
  }
};
