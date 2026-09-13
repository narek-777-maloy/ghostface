import discord

async def send_log(bot, channel, embed):
    if not channel:
        return
    try:
        hooks = await channel.webhooks()
        hook = next((h for h in hooks if h.name == "Логи" and h.user and h.user.id == bot.user.id), None)
        if not hook:
            hook = await channel.create_webhook(name="Логи", reason="Ghostface logging")
        await hook.send(embed=embed, username="ghostface | Логи",
                        avatar_url=bot.user.display_avatar.url, wait=True)
    except (discord.Forbidden, discord.HTTPException):
        try:
            await channel.send(embed=embed)
        except (discord.Forbidden, discord.HTTPException):
            pass
