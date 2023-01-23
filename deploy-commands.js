import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const commands = [];

const commandsPath = './commands';
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for await (const file of commandFiles) {
	const filePath = commandsPath + '/' + file;
	const command = await import(filePath);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		const data = await rest.put(
			Routes.applicationCommands(process.env.CLIENT_ID),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();
