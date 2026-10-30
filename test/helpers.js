import assert from "node:assert/strict";

export function createRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(values, random) {
  const copy = values.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const hold = copy[index];
    copy[index] = copy[swapIndex];
    copy[swapIndex] = hold;
  }
  return copy;
}

function compareIds(left, right) {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

function storedRating(rating) {
  return rating === 0 ? 0 : rating;
}

export function assertSplit(result, players, teamCount, teamSize) {
  assert.equal(result.teams.length, teamCount);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.teams), true);
  const ratings = new Map();
  for (let index = 0; index < players.length; index += 1) {
    ratings.set(players[index].id, storedRating(players[index].rating));
  }
  const seen = new Set();
  let max = null;
  let min = null;
  for (let teamIndex = 0; teamIndex < result.teams.length; teamIndex += 1) {
    const team = result.teams[teamIndex];
    assert.equal(Object.isFrozen(team), true);
    assert.equal(Object.isFrozen(team.members), true);
    assert.equal(team.members.length, teamSize);
    let total = 0;
    for (let memberIndex = 0; memberIndex < team.members.length; memberIndex += 1) {
      const id = team.members[memberIndex];
      if (memberIndex > 0) {
        assert.equal(team.members[memberIndex - 1] < id, true);
      }
      assert.equal(seen.has(id), false, id);
      seen.add(id);
      total += ratings.get(id);
    }
    assert.equal(team.total, storedRating(total));
    if (max === null || team.total > max) {
      max = team.total;
    }
    if (min === null || team.total < min) {
      min = team.total;
    }
    if (teamIndex > 0) {
      const previous = result.teams[teamIndex - 1].members;
      assert.equal(compareIds(previous[0], team.members[0]) < 0, true);
    }
  }
  assert.equal(seen.size, players.length);
  assert.equal(result.spread, storedRating(max - min));
}

export function assertParties(result, parties) {
  for (let partyIndex = 0; partyIndex < parties.length; partyIndex += 1) {
    const party = parties[partyIndex];
    let host = -1;
    for (let teamIndex = 0; teamIndex < result.teams.length; teamIndex += 1) {
      const members = new Set(result.teams[teamIndex].members);
      let hits = 0;
      for (let idIndex = 0; idIndex < party.length; idIndex += 1) {
        if (members.has(party[idIndex])) {
          hits += 1;
        }
      }
      assert.equal(hits === 0 || hits === party.length, true);
      if (hits === party.length) {
        assert.equal(host, -1);
        host = teamIndex;
      }
    }
    assert.equal(host >= 0, true);
  }
}
