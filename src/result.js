import { compareIdLists, compareIds, compareTeams } from "./order.js";

export function isBetter(candidate, incumbent) {
  if (candidate.spread < incumbent.spread) {
    return true;
  }
  if (candidate.spread > incumbent.spread) {
    return false;
  }
  return compareTeams(candidate.teams, incumbent.teams) < 0;
}

export function safeToPrune(units, teamSize) {
  let maxAbsolute = 0;
  for (let index = 0; index < units.length; index += 1) {
    const ratings = units[index].ratings;
    for (let ratingIndex = 0; ratingIndex < ratings.length; ratingIndex += 1) {
      const rating = ratings[ratingIndex];
      if (!Number.isSafeInteger(rating)) {
        return false;
      }
      const absolute = rating < 0 ? -rating : rating;
      if (absolute > maxAbsolute) {
        maxAbsolute = absolute;
      }
    }
  }
  return Number.isSafeInteger(maxAbsolute * teamSize);
}

export function materialize(units, assignment, teamCount) {
  const buckets = [];
  for (let team = 0; team < teamCount; team += 1) {
    buckets.push([]);
  }
  for (let index = 0; index < units.length; index += 1) {
    const unit = units[index];
    const team = assignment[unit.index];
    const bucket = buckets[team];
    for (let idIndex = 0; idIndex < unit.ids.length; idIndex += 1) {
      bucket.push({
        id: unit.ids[idIndex],
        rating: unit.ratings[idIndex]
      });
    }
  }

  const teams = [];
  for (let team = 0; team < buckets.length; team += 1) {
    const rows = buckets[team];
    rows.sort((left, right) => compareIds(left.id, right.id));
    const members = [];
    let total = 0;
    for (let index = 0; index < rows.length; index += 1) {
      members.push(rows[index].id);
      total += rows[index].rating;
    }
    teams.push({
      members,
      total: total === 0 ? 0 : total
    });
  }
  teams.sort((left, right) => compareIdLists(left.members, right.members));

  let max = teams[0].total;
  let min = teams[0].total;
  for (let team = 1; team < teams.length; team += 1) {
    if (teams[team].total > max) {
      max = teams[team].total;
    }
    if (teams[team].total < min) {
      min = teams[team].total;
    }
  }
  let spread = max - min;
  if (!Number.isFinite(max) || !Number.isFinite(min) || !Number.isFinite(spread)) {
    spread = Number.POSITIVE_INFINITY;
  }

  const frozen = [];
  for (let team = 0; team < teams.length; team += 1) {
    frozen.push(
      Object.freeze({
        members: Object.freeze(teams[team].members),
        total: teams[team].total
      })
    );
  }
  return {
    teams: Object.freeze(frozen),
    spread: spread === 0 ? 0 : spread
  };
}
