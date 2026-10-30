import { compareIdLists, compareIds } from "./order.js";

function sumRatings(ratings) {
  let total = 0;
  for (let index = 0; index < ratings.length; index += 1) {
    total += ratings[index];
  }
  return total === 0 ? 0 : total;
}

function comparePartyUnits(left, right) {
  return compareIdLists(left.ids, right.ids);
}

export function buildUnits(players, parties) {
  const ratings = new Map();
  for (let index = 0; index < players.length; index += 1) {
    ratings.set(players[index].id, players[index].rating);
  }

  const partyUnits = [];
  for (let index = 0; index < parties.length; index += 1) {
    const ids = parties[index].slice().sort(compareIds);
    const memberRatings = [];
    for (let idIndex = 0; idIndex < ids.length; idIndex += 1) {
      memberRatings.push(ratings.get(ids[idIndex]));
    }
    partyUnits.push({
      ids,
      ratings: memberRatings,
      size: ids.length,
      rating: sumRatings(memberRatings)
    });
  }
  partyUnits.sort(comparePartyUnits);

  const grouped = new Set();
  for (let index = 0; index < partyUnits.length; index += 1) {
    const ids = partyUnits[index].ids;
    for (let idIndex = 0; idIndex < ids.length; idIndex += 1) {
      grouped.add(ids[idIndex]);
    }
  }

  const soloUnits = [];
  for (let index = 0; index < players.length; index += 1) {
    const player = players[index];
    if (!grouped.has(player.id)) {
      soloUnits.push({
        ids: [player.id],
        ratings: [player.rating],
        size: 1,
        rating: player.rating
      });
    }
  }
  soloUnits.sort((left, right) => compareIds(left.ids[0], right.ids[0]));

  const units = partyUnits.concat(soloUnits);
  for (let index = 0; index < units.length; index += 1) {
    units[index].index = index;
  }
  return units;
}
