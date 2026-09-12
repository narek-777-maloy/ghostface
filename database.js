// Простое хранилище данных в JSON-файле.
// Никаких нативных зависимостей — работает на любом Node.js хостинге (bothost.ru в том числе).

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

const DEFAULT_DATA = {
  invites: {},        // { userId: totalCount }
  invitedBy: {},       // { newMemberId: inviterId }  -- чтобы корректно отнимать инвайты при выходе
  giveaways: {},       // { messageId: {...} }
  tournaments: {}      // { messageId: {...} }
};

function load() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
  }
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    return { ...DEFAULT_DATA };
  }
}

let cache = load();

function save() {
  fs.writeFileSync(DB_PATH, JSON.stringify(cache, null, 2));
}

module.exports = {
  get data() {
    return cache;
  },
  save,

  // --- invites helpers ---
  addInvite(userId, amount = 1) {
    cache.invites[userId] = (cache.invites[userId] || 0) + amount;
    save();
    return cache.invites[userId];
  },
  getInvites(userId) {
    return cache.invites[userId] || 0;
  },
  setInvitedBy(memberId, inviterId) {
    cache.invitedBy[memberId] = inviterId;
    save();
  },
  getInviter(memberId) {
    return cache.invitedBy[memberId];
  },
  removeInvitedBy(memberId) {
    delete cache.invitedBy[memberId];
    save();
  },

  // --- giveaways helpers ---
  createGiveaway(messageId, giveawayData) {
    cache.giveaways[messageId] = giveawayData;
    save();
  },
  getGiveaway(messageId) {
    return cache.giveaways[messageId];
  },
  updateGiveaway(messageId, patch) {
    if (!cache.giveaways[messageId]) return;
    Object.assign(cache.giveaways[messageId], patch);
    save();
  },
  deleteGiveaway(messageId) {
    delete cache.giveaways[messageId];
    save();
  },
  getAllGiveaways() {
    return cache.giveaways;
  },

  // --- tournaments helpers ---
  createTournament(messageId, data) {
    cache.tournaments[messageId] = data;
    save();
  },
  getTournament(messageId) {
    return cache.tournaments[messageId];
  },
  updateTournament(messageId, patch) {
    if (!cache.tournaments[messageId]) return;
    Object.assign(cache.tournaments[messageId], patch);
    save();
  }
};
