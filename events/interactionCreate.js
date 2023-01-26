import { Events, inlineCode } from 'discord.js';

export const name = Events.InteractionCreate;
export async function execute(interaction) {
	if (!interaction.isChatInputCommand()) {
		return;
	}

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		await interaction.editReply({ content: `Oh no! An unexpected error occurred while executing this command: ${inlineCode(error.message)}` });
		console.error(`Error executing ${interaction.commandName}`);
		console.error(error);
	}
}
