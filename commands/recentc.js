import { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { request } from 'undici';
import { drawCanvas } from '../canvas/match.js';
import { msToLengthStr } from '../utils.js';

export const data = new SlashCommandBuilder()
	.setName('recentc')
	.setDescription('[EXPERIMENTAL] Provides information about a player\'s most recent competitive match as a picture.')
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
			.setDescription('Player\'s region (default is Americas)')
			.addChoices(
				{ name: 'Americas', value: 'na' },
				{ name: 'Europe', value: 'eu' },
				{ name: 'Asia-Pacific', value: 'ap' },
				{ name: 'Korea', value: 'kr' },
			));

export async function execute(interaction) {
	const username = interaction.options.getString('username');
	const tag = interaction.options.getString('tag');
	const region = interaction.options.getString('region') ?? 'na';

	await interaction.deferReply();

	// TODO - maybe use Promise.all for efficiency
	const reqAcc = await request(`https://api.henrikdev.xyz/valorant/v1/account/${username}/${tag}`);
	const resAcc = await reqAcc.body.json();
	if (resAcc.status != 200) {
		await interaction.editReply({ content: `There was an error while executing this command: ${resAcc.errors[0].message}` });
		return;
	}
	const dataAcc = resAcc.data;
	const puuid = dataAcc.puuid;

	const req = await request(`https://api.henrikdev.xyz/valorant/v3/matches/${region}/${username}/${tag}?filter=competitive`);
	const res = await req.body.json();
	if (res.status != 200) {
		await interaction.editReply({ content: `There was an error while executing this command: ${res.errors[0].message}` });
		return;
	}
	const match = res.data[0];

	const userTeam = match.players.all_players.find(p => p.puuid == puuid).team;
	const winningTeam = match.teams.red.rounds_won > match.teams.blue.rounds_won ? 'Red' : match.teams.blue.rounds_won > match.teams.red.rounds_won ? 'Blue' : 'Tie';

	const embed = new EmbedBuilder()
		.setColor(0xcd7dff)
		.setAuthor({ name: 'Most Recent Competitive Match' })
		.setTitle(`${username}#${tag}`)
		.setThumbnail(dataAcc.card.small)
		.addFields(
			{ name: 'Map', value: match.metadata.map, inline: true },
			{ name: 'Server', value: match.metadata.cluster, inline: true },
			{ name: 'Length', value: msToLengthStr(match.metadata.game_length), inline: true },
			{ name: 'Outcome', value: userTeam == winningTeam ? 'Won' : winningTeam == 'Tie' ? 'Tie' : 'Lost', inline: true },
			{ name: 'Score', value: `Team A ${match.teams.red.rounds_won} : ${match.teams.blue.rounds_won} Team B`, inline: true },
		)
		.setFooter({ text: 'Match Date' })
		.setTimestamp(new Date(match.metadata.game_start * 1000));

	const canvasImg = await drawCanvas(match);
	const imgAttach = new AttachmentBuilder(canvasImg, { name: 'match-details.png' });
	embed.setImage('attachment://match-details.png');

	await interaction.editReply({ embeds: [embed], files: [imgAttach] });
}
