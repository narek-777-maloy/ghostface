const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../utils/webhookLogger');

module.exports = {
  name: 'roleDelete',
  async execute(role, config) {
    if (role.guild.id !== config.guildId) return;

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('🏷️ Роль удалена')
      .setDescription(`\`${role.name}\``)
      .setTimestamp();

    sendLog(role.client, config.logChannelId, embed);
  }
};
