import discord
from discord.ext import commands, tasks
from utils.config import load
import database

CFG=load()

class Ghostface(commands.Bot):
    def __init__(self):
        intents=discord.Intents.default()
        intents.members=True
        intents.message_content=True
        intents.voice_states=True
        super().__init__(command_prefix="!",intents=intents)

    async def setup_hook(self):
        await database.init()
        for ext in ("events.logs","events.invites","commands.invites",
                    "commands.giveaways","commands.applications","commands.tournaments"):
            await self.load_extension(ext)
        guild=discord.Object(id=int(CFG["guildId"]))
        self.tree.copy_global_to(guild=guild)
        await self.tree.sync(guild=guild)

    async def on_ready(self):
        await self.set_dnd()
        if not self.reset_presence.is_running(): self.reset_presence.start()
        print(f"Ghostface online: {self.user} ({self.user.id})")

    async def set_dnd(self):
        await self.change_presence(status=discord.Status.dnd,activity=discord.Game("ghostface"))

    @tasks.loop(minutes=10)
    async def reset_presence(self): await self.set_dnd()

bot=Ghostface()
bot.run(CFG["token"])
