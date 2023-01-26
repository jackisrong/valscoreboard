import { createCanvas, loadImage, registerFont } from 'canvas';
import { MAPS } from '../constants.js';

const X_POS = {
	agent: 40,
	player: 100,
	rank: 320,
	acs: 370,
	kills: 420,
	deaths: 470,
	assists: 520,
	plusminus: 570,
	kd: 620,
	adr: 670,
};

const MAX_WIDTH = {
	agent: 50,
	player: 200,
	rank: 40,
	acs: 50,
	kills: 50,
	deaths: 50,
	assists: 50,
	plusminus: 50,
	kd: 50,
	adr: 50,
};

function drawTeamHeader(ctx, teamName, yPos) {
	ctx.font = '10px Roboto';
	ctx.fillStyle = '#ffffff';
	ctx.fillText(teamName, X_POS.agent, yPos, MAX_WIDTH.agent);
	ctx.fillText('Player', X_POS.player, yPos, MAX_WIDTH.player);
	ctx.fillText('Match Rank', X_POS.rank, yPos, MAX_WIDTH.rank);
	ctx.fillText('ACS', X_POS.acs, yPos, MAX_WIDTH.acs);
	ctx.fillText('Kills', X_POS.kills, yPos, MAX_WIDTH.kills);
	ctx.fillText('Deaths', X_POS.deaths, yPos, MAX_WIDTH.deaths);
	ctx.fillText('Assists', X_POS.assists, yPos, MAX_WIDTH.assists);
	ctx.fillText('+/-', X_POS.plusminus, yPos, MAX_WIDTH.plusminus);
	ctx.fillText('K/D', X_POS.kd, yPos, MAX_WIDTH.kd);
	ctx.fillText('ADR', X_POS.adr, yPos, MAX_WIDTH.adr);
}

async function drawPlayerStats(ctx, player, yPos, numRounds, partyColour) {
	if (partyColour) {
		ctx.fillStyle = partyColour;
		ctx.fillRect(0, yPos, 10, 50);
	}

	const agentImg = await loadImage(player.assets.agent.small);
	ctx.drawImage(agentImg, X_POS.agent, yPos, MAX_WIDTH.agent, MAX_WIDTH.agent);

	ctx.font = '17px Roboto';
	ctx.fillStyle = '#ffffff';
	ctx.fillText(`${player.name}#${player.tag}`, X_POS.player, yPos + 30, MAX_WIDTH.player);

	const rankImg = await loadImage(`https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${player.currenttier}/smallicon.png`);
	ctx.drawImage(rankImg, X_POS.rank, yPos, MAX_WIDTH.rank, MAX_WIDTH.rank);

	const stats = player.stats;

	ctx.fillText(parseInt(stats.score / numRounds), X_POS.acs, yPos + 30, MAX_WIDTH.acs);
	ctx.fillText(stats.kills, X_POS.kills, yPos + 30, MAX_WIDTH.kills);
	ctx.fillText(stats.deaths, X_POS.deaths, yPos + 30, MAX_WIDTH.deaths);
	ctx.fillText(stats.assists, X_POS.assists, yPos + 30, MAX_WIDTH.assists);
	ctx.fillText(stats.kills - stats.deaths, X_POS.plusminus, yPos + 30, MAX_WIDTH.plusminus);
	ctx.fillText((stats.kills / stats.deaths).toFixed(1), X_POS.kd, yPos + 30, MAX_WIDTH.kd);
	ctx.fillText(parseInt(player.damage_made / numRounds), X_POS.adr, yPos + 30, MAX_WIDTH.adr);
}

function sortByACS(a, b) {
	if (a.stats.score < b.stats.score) {
		return 1;
	} else {
		return -1;
	}
}

export async function drawCanvas(data) {
	registerFont('assets/fonts/Roboto.ttf', { family: 'Roboto' });
	const canvas = createCanvas(800, 700);
	const ctx = canvas.getContext('2d');

	const mapUuid = MAPS.find(m => m.name == data.metadata.map).uuid;
	const mapImg = await loadImage(`https://media.valorant-api.com/maps/${mapUuid}/splash.png`);
	const mapImgRatio = Math.max(canvas.width / mapImg.width, canvas.height / mapImg.height);
	const mapImgResize = {
		width: mapImg.width * mapImgRatio,
		height: mapImg.height * mapImgRatio,
	};
	ctx.drawImage(mapImg, canvas.width / 2 - mapImgResize.width / 2, canvas.height / 2 - mapImgResize.height / 2, mapImgResize.width, mapImgResize.height);

	// #0f141a
	ctx.fillStyle = 'rgba(15, 20, 26, 0.85)';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	const numRounds = data.metadata.rounds_played;
	const partyColours = ['rgb(43, 140, 238)', 'rgb(111, 251, 167)', 'rgb(195, 34, 37)', 'rgb(254, 97, 0)'];
	const parties = [];
	data.players.all_players.forEach(player => {
		const findParty = parties.find(party => party.uuid == player.party_id);
		if (!findParty) {
			parties.push({ uuid: player.party_id, numPlayers: 1, colour: '' });
		} else {
			findParty.numPlayers++;
			if (!findParty.colour) {
				findParty.colour = partyColours.pop();
			}
		}
	});

	data.players.red.sort(sortByACS);

	let yPos = 30;
	drawTeamHeader(ctx, 'Team A', yPos);
	yPos += 10;

	for (const player of data.players.red) {
		const findParty = parties.find(party => party.uuid == player.party_id);
		await drawPlayerStats(ctx, player, yPos, numRounds, findParty.colour);
		yPos += 60;
	}

	data.players.blue.sort(sortByACS);

	yPos += 30;
	drawTeamHeader(ctx, 'Team B', yPos);
	yPos += 10;

	for (const player of data.players.blue) {
		const findParty = parties.find(party => party.uuid == player.party_id);
		await drawPlayerStats(ctx, player, yPos, numRounds, findParty.colour);
		yPos += 60;
	}

	return canvas.createPNGStream();
}
