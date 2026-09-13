import asyncio, random, time
import discord
from discord import app_commands
from discord.ext import commands
import database
from utils.permissions import is_admin

class GiveawayView(discord.ui.View):
    def __init__(self, cog, message_id=None):
        super().__init__(timeout=None)
        self.cog = cog
        self.message_id = message_id
    @discord.ui.button(label="Участвовать", style=discord.ButtonStyle.success, emoji="🎉", custom_id="ghostface:giveaway_join")
    async def join(self, interaction, button):
        mid = interaction.message.id
        row = await database.fetchone("SELECT 1 FROM giveaway_entries WHERE message_id=? AND user_id=?", (mid, interaction.user.id))
        if row:
            return await interaction.response.send_message("Ты уже участвуешь.", ephemeral=True)
        await database.execute("INSERT INTO giveaway_entries(message_id,user_id) VALUES(?,?)", (mid, interaction.user.id))
        await interaction.response.send_message("🎉 Участие подтверждено!", ephemeral=True)

class Giveaways(commands.Cog):
    def __init__(self, bot):
        self.bot=bot
        self.tasks=set()

    @app_commands.command(name="gstart", description="Запустить конкурс")
    @app_commands.describe(time="Длительность в секундах", winners="Победителей", prize="Приз")
    async def start(self, interaction, time: app_commands.Range[int, 10, 2592000],
                    winners: app_commands.Range[int, 1, 20], prize: str):
        if not is_admin(interaction): return await interaction.response.send_message("❌ Недостаточно прав.",ephemeral=True)
        end=time.time()+time
        e=discord.Embed(title="🎉 КОНКУРС",description=f"Приз: **{prize}**\nПобедителей: **{winners}**\nНажмите кнопку ниже.")
        e.add_field(name="Окончание",value=f"<t:{int(end)}:R>")
        await interaction.response.send_message(embed=e)
        msg=await interaction.original_response()
        await database.execute("INSERT INTO giveaways VALUES(?,?,?,?,?,0)",(msg.id,interaction.channel.id,interaction.user.id,prize,winners,end))
        await msg.edit(view=GiveawayView(self,msg.id))
        task=asyncio.create_task(self.finish(msg.id))
        self.tasks.add(task); task.add_done_callback(self.tasks.discard)

    async def finish(self, mid):
        row=await database.fetchone("SELECT channel_id,prize,winners,ends_at,ended FROM giveaways WHERE message_id=?",(mid,))
        if not row or row[4]: return
        await asyncio.sleep(max(0,row[3]-time.time()))
        users=[r[0] for r in await database.fetchall("SELECT user_id FROM giveaway_entries WHERE message_id=?",(mid,))]
        winners=random.sample(users,min(row[2],len(users))) if users else []
        mentions=", ".join(f"<@{x}>" for x in winners) or "Нет участников."
        channel=self.bot.get_channel(row[0])
        msg=await channel.fetch_message(mid)
        await database.execute("UPDATE giveaways SET ended=1 WHERE message_id=?",(mid,))
        await msg.edit(content=f"🎉 **Конкурс завершён!**\nПриз: **{row[1]}**\nПобедители: {mentions}",view=None)

    @app_commands.command(name="gend",description="Досрочно завершить конкурс")
    @app_commands.describe(message_id="ID сообщения конкурса")
    async def end(self,interaction,message_id:str):
        if not is_admin(interaction): return await interaction.response.send_message("❌ Недостаточно прав.",ephemeral=True)
        row=await database.fetchone("SELECT ends_at FROM giveaways WHERE message_id=?",(int(message_id),))
        if not row: return await interaction.response.send_message("❌ Конкурс не найден.",ephemeral=True)
        await database.execute("UPDATE giveaways SET ends_at=? WHERE message_id=?",(time.time(),int(message_id)))
        await interaction.response.send_message("✅ Конкурс будет завершён.")
        await self.finish(int(message_id))

    @app_commands.command(name="greroll",description="Перевыбрать победителя")
    @app_commands.describe(message_id="ID сообщения конкурса")
    async def reroll(self,interaction,message_id:str):
        if not is_admin(interaction): return await interaction.response.send_message("❌ Недостаточно прав.",ephemeral=True)
        users=[r[0] for r in await database.fetchall("SELECT user_id FROM giveaway_entries WHERE message_id=?",(int(message_id),))]
        if not users: return await interaction.response.send_message("❌ Участников нет.",ephemeral=True)
        await interaction.response.send_message(f"🎉 Новый победитель: <@{random.choice(users)}>")

async def setup(bot): await bot.add_cog(Giveaways(bot))
