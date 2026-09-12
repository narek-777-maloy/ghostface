const { EmbedBuilder } = require('discord.js');
const db = require('../database');
const { sendLog } = require('./webhookLogger');

// Кэш инвайтов по гильдиям: Map<guildId, Map<code, uses>>
const invitesCache = new Map();

async function cacheGuildInvites(guild) {
  try {
    const invites = await guild.invites.fetch();
    const map = new Map();
    invites.forEach(inv => map.set(inv.code, inv.uses || 0));

    // vanity url (кастомная ссылка сервера), если есть
    if (guild.vanityURLCode) {
      try {
        const vanity = await guild.fetchVanityData();
        map.set(guild.vanityURLCode, vanity.uses || 0);
      } catch (_) {}
    }

    invitesCache.set(guild.id, map);
  } catch (err) {
    console.error('Не удалось получить инвайты сервера (нужны права "Управление сервером"):', err.message);
  }
}

async function handleMemberJoin(member, config) {
  const guild = member.guild;
  const oldMap = invitesCache.get(guild.id) || new Map();

  let usedInvite = null;
  let newMap = new Map();

  try {
    const invites = await guild.invites.fetch();
    newMap = new Map(invites.map(inv => [inv.code, inv.uses || 0]));

    for (const inv of invites.values()) {
      const before = oldMap.get(inv.code) || 0;
      if ((inv.uses || 0) > before) {
        usedInvite = inv;
        break;
      }
    }

    // проверка vanity url
    if (!usedInvite && guild.vanityURLCode) {
      try {
        const vanity = await guild.fetchVanityData();
        const before = oldMap.get(guild.vanityURLCode) || 0;
        if ((vanity.uses || 0) > before) {
          usedInvite = { inviter: null, code: guild.vanityURLCode, vanity: true };
        }
        newMap.set(guild.vanityURLCode, vanity.uses || 0);
      } catch (_) {}
    }
  } catch (err) {
    console.error('Ошибка при определении инвайта:', err.message);
  }

  invitesCache.set(guild.id, newMap);

  if (usedInvite && usedInvite.inviter) {
    const inviterId = usedInvite.inviter.id;
    db.setInvitedBy(member.id, inviterId);
    const total = db.addInvite(inviterId, 1);

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setDescription(
        `📥 **${member.user.tag}** зашёл(-ла) на сервер по приглашению **${usedInvite.inviter.tag}**\n` +
        `Код приглашения: \`${usedInvite.code}\`\n` +
        `Всего инвайтов у **${usedInvite.inviter.tag}**: **${total}**`
      )
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();

    sendLog(guild.client, config.inviteLogChannelId, embed);
  } else if (usedInvite && usedInvite.vanity) {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setDescription(`📥 **${member.user.tag}** зашёл(-ла) на сервер по кастомной ссылке сервера (vanity URL)`)
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();
    sendLog(guild.client, config.inviteLogChannelId, embed);
  } else {
    const embed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setDescription(
        `📥 **${member.user.tag}** зашёл(-ла) на сервер.\n` +
        `Не удалось определить приглашение (возможно, истёкшая ссылка или добавление ботом).`
      )
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();
    sendLog(guild.client, config.inviteLogChannelId, embed);
  }
}

async function handleMemberLeave(member, config) {
  const guild = member.guild;
  const inviterId = db.getInviter(member.id);

  if (inviterId) {
    const newTotal = db.addInvite(inviterId, -1);
    db.removeInvitedBy(member.id);

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setDescription(
        `📤 **${member.user.tag}** покинул(-а) сервер.\n` +
        `Был(-а) приглашён(-а) пользователем <@${inviterId}>. У него теперь **${newTotal}** инвайт(ов).`
      )
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();
    sendLog(guild.client, config.inviteLogChannelId, embed);
  }

  // на всякий случай обновим кэш инвайтов после ухода (счётчики uses не уменьшаются у Discord,
  // но пересчитаем на всякий случай, если ссылка была удалена)
  cacheGuildInvites(guild).catch(() => {});
}

module.exports = { cacheGuildInvites, handleMemberJoin, handleMemberLeave };
