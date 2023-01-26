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

	const accountRequest = request(`https://api.henrikdev.xyz/valorant/v1/account/${username}/${tag}`);
	const matchesRequest = request(`https://api.henrikdev.xyz/valorant/v3/matches/${region}/${username}/${tag}?filter=competitive`);
	const [accountMessage, matchesMessage] = await Promise.all([accountRequest, matchesRequest]);
	if (accountMessage.statusCode != 200) {
		throw new Error(`Reply from account API returned status code ${accountMessage.statusCode}`);
	}
	if (matchesMessage.statusCode != 200) {
		throw new Error(`Reply from matches API returned status code ${matchesMessage.statusCode}`);
	}
	const [accountJson, matchesJson] = await Promise.all([accountMessage.body.json(), matchesMessage.body.json()]);
	const account = accountJson.data;
	const puuid = account.puuid;
	const match = matchesJson.data[0];

	const userTeam = match.players.all_players.find(p => p.puuid == puuid).team;
	const winningTeam = match.teams.red.rounds_won > match.teams.blue.rounds_won ? 'Red' : match.teams.blue.rounds_won > match.teams.red.rounds_won ? 'Blue' : 'Tie';

	const embed = new EmbedBuilder()
		.setColor(0xcd7dff)
		.setAuthor({ name: 'Most Recent Competitive Match' })
		.setTitle(`${username}#${tag}`)
		.setThumbnail(account.card.small)
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
