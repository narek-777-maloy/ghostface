const { ActivityType } = require('discord.js');
const { cacheGuildInvites } = require('../utils/inviteTracker');
const { startScheduler } = require('../utils/giveawayManager');

function applyPresence(client) {
  client.user.setPresence({
    status: 'dnd',
    activities: [{ name: 'ghostface | Anteyka', type: ActivityType.Watching }]
  });
}

module.exports = {
  name: 'ready',
  once: true,
  async execute(client, config) {
    console.log(`✅ Бот запущен как ${client.user.tag}`);

    applyPresence(client);
    // Периодически подтверждаем статус "Не беспокоить" на случай, если Discord его сбросит
    setInterval(() => applyPresence(client), 10 * 60 * 1000);

    const guild = client.guilds.cache.get(config.guildId);
    if (guild) {
      await cacheGuildInvites(guild);
      console.log('📨 Кэш инвайтов загружен.');

      // Кэшируем всех участников — нужно для точных логов ников/аватаров/ролей
      guild.members.fetch()
        .then(members => console.log(`👥 Кэш участников загружен (${members.size}).`))
        .catch(err => console.warn('⚠️ Не удалось полностью закэшировать участников:', err.message));
    } else {
      console.warn('⚠️ Не удалось найти сервер по guildId из config.json');
    }

    startScheduler(client);
    console.log('🎉 Планировщик конкурсов запущен.');
  }
};
