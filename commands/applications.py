import time, json
import discord
from discord import app_commands
from discord.ext import commands
import database
from utils.config import load
from utils.permissions import is_admin

class ReviewView(discord.ui.View):
    def __init__(self, app_id): super().__init__(timeout=None); self.app_id=app_id

    async def change(self, interaction, status):
        if not is_admin(interaction): return await interaction.response.send_message("❌ Недостаточно прав.",ephemeral=True)
        row=await database.fetchone("SELECT user_id,status FROM applications WHERE id=?",(self.app_id,))
        if not row: return await interaction.response.send_message("❌ Заявка не найдена.",ephemeral=True)
        await database.execute("UPDATE applications SET status=? WHERE id=?",(status,self.app_id))
        await interaction.response.send_message(("✅ Заявка принята." if status=="accepted" else "❌ Заявка отклонена."))

    @discord.ui.button(label="Принять",style=discord.ButtonStyle.success,custom_id="ghostface:apply_accept")
    async def accept(self,interaction,button): await self.change(interaction,"accepted")
    @discord.ui.button(label="Отклонить",style=discord.ButtonStyle.danger,custom_id="ghostface:apply_reject")
    async def reject(self,interaction,button): await self.change(interaction,"rejected")

class ApplyModal(discord.ui.Modal,title="Заявка"):
    name=discord.ui.TextInput(label="Имя / игровой ник",max_length=100)
    age=discord.ui.TextInput(label="Возраст",max_length=3)
    about=discord.ui.TextInput(label="Расскажите о себе",style=discord.TextStyle.paragraph,max_length=1000)
    kind=discord.ui.TextInput(label="Направление (staff/media)",max_length=20)

    async def on_submit(self,interaction):
        cfg=load(); channel=interaction.guild.get_channel(int(cfg["staffReviewChannelId"]))
        await database.execute("INSERT INTO applications(guild_id,user_id,kind,name,age,about,created_at) VALUES(?,?,?,?,?,?,?)",
                                (interaction.guild.id,interaction.user.id,self.kind.value.lower(),self.name.value,self.age.value,self.about.value,time.time()))
        app_id=(await database.fetchone("SELECT last_insert_rowid()"))[0]
        e=discord.Embed(title="📋 Новая заявка")
        e.add_field(name="ID",value=str(app_id))
        e.add_field(name="Пользователь",value=interaction.user.mention)
        e.add_field(name="Направление",value=self.kind.value)
        e.add_field(name="Имя / ник",value=self.name.value,inline=False)
        e.add_field(name="Возраст",value=self.age.value)
        e.add_field(name="О себе",value=self.about.value,inline=False)
        await channel.send(embed=e,view=ReviewView(app_id))
        await interaction.response.send_message("✅ Заявка отправлена.",ephemeral=True)

class ApplyView(discord.ui.View):
    def __init__(self): super().__init__(timeout=None)
    @discord.ui.button(label="Подать заявку",style=discord.ButtonStyle.primary,emoji="📝",custom_id="ghostface:apply")
    async def apply(self,interaction,button): await interaction.response.send_modal(ApplyModal())

class Applications(commands.Cog):
    def __init__(self,bot): self.bot=bot
    @app_commands.command(name="setup-apply",description="Создать панель заявок")
    async def setup(self,interaction):
        if not is_admin(interaction): return await interaction.response.send_message("❌ Недостаточно прав.",ephemeral=True)
        e=discord.Embed(title="📋 Набор в команду",description="Выберите направление и заполните форму.")
        await interaction.channel.send(embed=e,view=ApplyView())
        await interaction.response.send_message("✅ Панель создана.",ephemeral=True)

async def setup(bot): await bot.add_cog(Applications(bot))
