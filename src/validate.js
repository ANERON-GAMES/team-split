import { DEFAULT_EXACT_LIMIT } from "./constants.js";

const INPUT_MESSAGE = "input must be an object";
const TEAM_COUNT_MESSAGE = "teamCount must be an integer greater than or equal to 1";
const TEAM_SIZE_MESSAGE = "teamSize must be an integer greater than or equal to 1";
const PLAYERS_MESSAGE = "players must be an array";
const PLAYER_MESSAGE = "player must be an object";
const PLAYER_ID_MESSAGE = "player id must be a non-empty string";
const PLAYER_RATING_MESSAGE = "player rating must be a finite number";
const DUPLICATE_ID_MESSAGE = "player id must be unique";
const PARTIES_MESSAGE = "parties must be an array";
const PARTY_MESSAGE = "party must be an array";
const PARTY_LENGTH_MESSAGE = "party must contain at least 2 player ids";
const PARTY_ID_MESSAGE = "party id must be a string";
const UNKNOWN_PLAYER_MESSAGE = "party id must name a player";
const PARTY_ONCE_MESSAGE = "party id must appear once";
const EXACT_LIMIT_MESSAGE = "exactLimit must be an integer greater than or equal to 0";
const PARTY_SIZE_MESSAGE = "party must contain at most teamSize player ids";
const SLOT_MESSAGE = "player count must equal teamCount * teamSize";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readTeamCount(input) {
  if (!Object.hasOwn(input, "teamCount")) {
    throw new RangeError(TEAM_COUNT_MESSAGE);
  }
  const value = input.teamCount;
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(TEAM_COUNT_MESSAGE);
  }
  return value;
}

function readTeamSize(input) {
  if (!Object.hasOwn(input, "teamSize")) {
    throw new RangeError(TEAM_SIZE_MESSAGE);
  }
  const value = input.teamSize;
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(TEAM_SIZE_MESSAGE);
  }
  return value;
}

function readPlayers(input) {
  if (!Object.hasOwn(input, "players")) {
    throw new TypeError(PLAYERS_MESSAGE);
  }
  const value = input.players;
  if (!Array.isArray(value)) {
    throw new TypeError(PLAYERS_MESSAGE);
  }
  const players = [];
  const seen = new Set();
  for (let index = 0; index < value.length; index += 1) {
    const player = value[index];
    if (!isObject(player)) {
      throw new TypeError(PLAYER_MESSAGE);
    }
    if (!Object.hasOwn(player, "id")) {
      throw new TypeError(PLAYER_ID_MESSAGE);
    }
    const id = player.id;
    if (typeof id !== "string" || id.length < 1) {
      throw new TypeError(PLAYER_ID_MESSAGE);
    }
    if (!Object.hasOwn(player, "rating")) {
      throw new RangeError(PLAYER_RATING_MESSAGE);
    }
    const rating = player.rating;
    if (typeof rating !== "number" || !Number.isFinite(rating)) {
      throw new RangeError(PLAYER_RATING_MESSAGE);
    }
    if (seen.has(id)) {
      throw new TypeError(DUPLICATE_ID_MESSAGE);
    }
    seen.add(id);
    players.push({
      id,
      rating: rating === 0 ? 0 : rating
    });
  }
  return players;
}

function readParties(input, players) {
  if (!Object.hasOwn(input, "parties")) {
    return [];
  }
  const value = input.parties;
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new TypeError(PARTIES_MESSAGE);
  }
  const known = new Set();
  for (let index = 0; index < players.length; index += 1) {
    known.add(players[index].id);
  }
  const used = new Set();
  const parties = [];
  for (let index = 0; index < value.length; index += 1) {
    const party = value[index];
    if (!Array.isArray(party)) {
      throw new TypeError(PARTY_MESSAGE);
    }
    if (party.length < 2) {
      throw new RangeError(PARTY_LENGTH_MESSAGE);
    }
    const ids = [];
    const local = new Set();
    for (let idIndex = 0; idIndex < party.length; idIndex += 1) {
      const id = party[idIndex];
      if (typeof id !== "string") {
        throw new TypeError(PARTY_ID_MESSAGE);
      }
      if (!known.has(id)) {
        throw new TypeError(UNKNOWN_PLAYER_MESSAGE);
      }
      if (local.has(id) || used.has(id)) {
        throw new TypeError(PARTY_ONCE_MESSAGE);
      }
      local.add(id);
      ids.push(id);
    }
    for (let idIndex = 0; idIndex < ids.length; idIndex += 1) {
      used.add(ids[idIndex]);
    }
    parties.push(ids);
  }
  return parties;
}

function readExactLimit(input) {
  if (!Object.hasOwn(input, "exactLimit")) {
    return DEFAULT_EXACT_LIMIT;
  }
  const value = input.exactLimit;
  if (value === undefined) {
    return DEFAULT_EXACT_LIMIT;
  }
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(EXACT_LIMIT_MESSAGE);
  }
  return value === 0 ? 0 : value;
}

export function readInput(input) {
  if (!isObject(input)) {
    throw new TypeError(INPUT_MESSAGE);
  }
  const teamCount = readTeamCount(input);
  const teamSize = readTeamSize(input);
  const players = readPlayers(input);
  const parties = readParties(input, players);
  const exactLimit = readExactLimit(input);
  for (let index = 0; index < parties.length; index += 1) {
    if (parties[index].length > teamSize) {
      throw new RangeError(PARTY_SIZE_MESSAGE);
    }
  }
  const slots = teamCount * teamSize;
  if (!Number.isSafeInteger(slots) || players.length !== slots) {
    throw new RangeError(SLOT_MESSAGE);
  }
  return {
    teamCount,
    teamSize,
    players,
    parties,
    exactLimit
  };
}
