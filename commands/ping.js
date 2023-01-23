import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('ping')
	.setDescription('Check bot status.');

export async function execute(interaction) {
	await interaction.reply('Hello! I am functional.');
}
