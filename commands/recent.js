import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { request } from 'undici';

export const data = new SlashCommandBuilder()
	.setName('recent')
	.setDescription('Provides information about a player\'s most recent competitive match.')
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

	const req = await request(`https://api.henrikdev.xyz/valorant/v3/matches/${dataAcc.region}/${username}/${tag}?filter=competitive`);
	const res = await req.body.json();
	if (res.status != 200) {
		await interaction.editReply({ content: `There was an error while executing this command: ${res.errors[0].message}` });
		return;
	}
	const match = res.data[0];

	const embed = new EmbedBuilder()
		.setColor(0xcd7dff)
		.setAuthor({ name: 'Most Recent Competitive Match' })
		.setTitle(`${username}#${tag}`)
		.setThumbnail(dataAcc.card.small)
		.addFields(
			{ name: 'Map', value: match.metadata.map },
			{ name: 'Server', value: match.metadata.cluster },
			// match.teams.red .has_won .rounds_won .rounds_lost
			{ name: 'Score', value: `${match.teams.red.rounds_won}:${match.teams.blue.rounds_won}` },
			{ name: '\u200B', value: 'K/D/A/ACS/ADR' },
		)
		.setTimestamp();

	const numRounds = match.metadata.rounds_played;
	for (const player of match.players.red) {
		// player.level player.player_card player.player_title player.party_id player.stats (.score, kills, deaths, assists, bodyshots, headshots, legshots)
		// player.damage_made player.damage_received
		const stats = player.stats;
		embed.addFields({ name: `${player.character} - ${player.name}#${player.tag} (${player.currenttier_patched})`, value: `${stats.kills}/${stats.deaths}/${stats.assists}/${parseInt(stats.score / numRounds)}/${parseInt(player.damage_made / numRounds)}` });
	}
	embed.addFields({ name: '\u200B', value: '\u200B' });
	for (const player of match.players.blue) {
		const stats = player.stats;
		embed.addFields({ name: `${player.character} - ${player.name}#${player.tag} (${player.currenttier_patched})`, value: `${stats.kills}/${stats.deaths}/${stats.assists}/${parseInt(stats.score / numRounds)}/${parseInt(player.damage_made / numRounds)}` });
	}

	await interaction.editReply({ embeds: [embed] });
}
