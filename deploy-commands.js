const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

let config;
try {
  config = require('./config.json');
} catch (err) {
  console.error('⛔ Не найден config.json! Скопируйте config.example.json в config.json и заполните его.');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log(`🔄 Регистрирую ${commands.length} слэш-команд(ы)...`);

    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );

    console.log('✅ Слэш-команды успешно зарегистрированы на сервере!');
  } catch (error) {
    console.error(error);
  }
})();
