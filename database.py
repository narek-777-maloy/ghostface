import aiosqlite
from pathlib import Path

DB = Path("data/ghostface.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS invite_counts (
    user_id INTEGER PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS invite_uses (
    code TEXT PRIMARY KEY,
    inviter_id INTEGER NOT NULL,
    uses INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS giveaways (
    message_id INTEGER PRIMARY KEY,
    channel_id INTEGER NOT NULL,
    host_id INTEGER NOT NULL,
    prize TEXT NOT NULL,
    winners INTEGER NOT NULL,
    ends_at REAL NOT NULL,
    ended INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS giveaway_entries (
    message_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY(message_id,user_id)
);
CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    kind TEXT NOT NULL,
    name TEXT NOT NULL,
    age TEXT NOT NULL,
    about TEXT NOT NULL,
    message_id INTEGER,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS tournaments (
    channel_id INTEGER PRIMARY KEY,
    message_id INTEGER,
    open INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS tournament_players (
    channel_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    nickname TEXT NOT NULL,
    server TEXT NOT NULL,
    PRIMARY KEY(channel_id,user_id)
);
"""

async def init():
    DB.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(DB) as db:
        await db.executescript(SCHEMA)
        await db.commit()

async def execute(sql, params=()):
    async with aiosqlite.connect(DB) as db:
        cur = await db.execute(sql, params)
        await db.commit()
        return cur

async def fetchone(sql, params=()):
    async with aiosqlite.connect(DB) as db:
        cur = await db.execute(sql, params)
        return await cur.fetchone()

async def fetchall(sql, params=()):
    async with aiosqlite.connect(DB) as db:
        cur = await db.execute(sql, params)
        return await cur.fetchall()
