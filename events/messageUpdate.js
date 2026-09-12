const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../utils/webhookLogger');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage, config) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const embed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setTitle('✏️ Сообщение изменено')
      .addFields(
        { name: 'Автор', value: `${newMessage.author.tag}`, inline: true },
        { name: 'Канал', value: `${newMessage.channel}`, inline: true },
        { name: 'До', value: oldMessage.content?.slice(0, 500) || '*пусто*' },
        { name: 'После', value: newMessage.content?.slice(0, 500) || '*пусто*' }
      )
      .setURL(newMessage.url)
      .setTimestamp();

    sendLog(newMessage.client, config.logChannelId, embed);
  }
};
