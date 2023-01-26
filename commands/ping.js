import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('ping')
	.setDescription('Check bot status.');

export async function execute(interaction) {
	await interaction.deferReply();
	await interaction.editReply('Hello! I am a bot created by BeefBurrito#MLNE to display player VALORANT stats!');
}
