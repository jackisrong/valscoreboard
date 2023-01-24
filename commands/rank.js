import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
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
			.setRequired(true));

export async function execute(interaction) {
	const username = interaction.options.getString('username');
	const tag = interaction.options.getString('tag');

	await interaction.deferReply();

	const reqAcc = await request(`https://api.henrikdev.xyz/valorant/v1/account/${username}/${tag}`);
	const resAcc = await reqAcc.body.json();
	if (resAcc.status != 200) {
		await interaction.editReply({ content: `There was an error while executing this command: ${resAcc.errors[0].message}` });
		return;
	}
	const dataAcc = resAcc.data;

	const req = await request(`https://api.henrikdev.xyz/valorant/v2/mmr/${dataAcc.region}/${username}/${tag}`);
	const res = await req.body.json();
	if (res.status != 200) {
		await interaction.editReply({ content: `There was an error while executing this command: ${res.errors[0].message}` });
		return;
	}
	const d = res.data;

	const embed = new EmbedBuilder()
		.setColor(0xcd7dff)
		.setAuthor({ name: 'Rank History' })
		.setTitle(`${username}#${tag}`)
		.setThumbnail(dataAcc.card.small)
		.addFields(
			{ name: 'Current Rank', value: d.current_data.currenttierpatched },
			{ name: 'Peak Rank', value: `${d.highest_rank.patched_tier} (${(d.highest_rank.season).toUpperCase()})` },
			{ name: '\u200B', value: '\u200B' },
		)
		.setTimestamp();

	for (const key in d.by_season) {
		if (d.by_season[key].error) {
			embed.addFields({ name: `${key.toUpperCase()}`, value: 'Unranked', inline: true });
		} else {
			embed.addFields({ name: `${key.toUpperCase()}`, value: d.by_season[key].final_rank_patched, inline: true });
		}
	}

	await interaction.editReply({ embeds: [embed] });
}
