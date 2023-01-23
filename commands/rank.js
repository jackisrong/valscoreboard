import { SlashCommandBuilder } from 'discord.js';
import { request } from 'undici';

export const data = new SlashCommandBuilder()
	.setName('rank')
	.setDescription('Provides information about a player\'s rank.')
	.addStringOption(option =>
		option.setName('username')
			.setDescription('Player\'s username (eg. BeefBurrito)')
			.setRequired(true))
	.addStringOption(option =>
		option.setName('tag')
			.setDescription('Player\'s tagline after the hashtag (ex. 0000)')
			.setRequired(true))
	.addStringOption(option =>
		option.setName('region')
			.setDescription('Player\'s account region (default Americas)')
			.addChoices(
				{ name: 'Americas', value: 'na' },
				{ name: 'Europe', value: 'eu' },
				{ name: 'Asia-Pacific', value: 'ap' },
				{ name: 'Korea', value: 'kr' },
			));

export async function execute(interaction) {
	const region = interaction.options.getString('region') ?? 'na';
	const username = interaction.options.getString('username');
	const tag = interaction.options.getString('tag');

	await interaction.deferReply();
	const req = await request(`https://api.henrikdev.xyz/valorant/v2/mmr/${region}/${username}/${tag}`);
	const res = (await req.body.json()).data;
	const reply = `${username}#${tag}'s current rank is ${res.current_data.currenttierpatched}. Their peak rank was ${res.highest_rank.patched_tier} during ${(res.highest_rank.season).toUpperCase()}.`;
	await interaction.editReply(reply);
}
