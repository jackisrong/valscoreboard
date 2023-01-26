import { hyperlink, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('ping')
	.setDescription('Check bot status.');

export async function execute(interaction) {
	await interaction.reply(`Hello! I am a bot created by BeefBurrito#MLNE to display player VALORANT stats! You can visit me on ${hyperlink('GitHub', 'https://github.com/jackisrong/valscoreboard')}!`);
}
