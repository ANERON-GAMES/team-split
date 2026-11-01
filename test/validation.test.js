import assert from "node:assert/strict";
import test from "node:test";
import { splitTeams } from "../src/index.js";

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
const INFEASIBLE_MESSAGE = "parties cannot be placed into the teams";
const TOTAL_MESSAGE = "team total must be finite";
const SPREAD_MESSAGE = "spread must be finite";

function pair(id, rating) {
  return { id, rating };
}

test("a call reads own fields and ignores unknown fields", () => {
  const inherited = { teamCount: 2, teamSize: 1, exactLimit: 0 };
  const missingOwn = Object.create(inherited);
  missingOwn.players = [pair("a", 1)];
  assert.throws(() => splitTeams(missingOwn), {
    name: "RangeError",
    message: TEAM_COUNT_MESSAGE
  });

  const bare = Object.create(null);
  bare.teamCount = 1;
  bare.teamSize = 1;
  bare.players = [pair("a", 4)];
  bare.note = true;
  const result = splitTeams(bare);
  assert.equal(result.teams[0].total, 4);
  assert.equal(result.spread, 0);

  const frozen = Object.freeze({
    teamCount: 1,
    teamSize: 1,
    players: Object.freeze([Object.freeze(pair("a", 2))]),
    parties: Object.freeze([]),
    extra: "ignored"
  });
  assert.equal(splitTeams(frozen).teams[0].members[0], "a");
});

test("omitted parties and exactLimit, and explicit undefined, use the defaults", () => {
  const players = [pair("a", 1), pair("b", 1)];
  const omitted = splitTeams({ teamCount: 2, teamSize: 1, players });
  const explicit = splitTeams({
    teamCount: 2,
    teamSize: 1,
    players,
    parties: undefined,
    exactLimit: undefined
  });
  assert.equal(omitted.method, "exact");
  assert.deepEqual(explicit, omitted);
});

test("the input must be an object", () => {
  for (const input of [undefined, null, [], "teams", 1, true, false]) {
    assert.throws(() => splitTeams(input), {
      name: "TypeError",
      message: INPUT_MESSAGE
    });
  }
});

test("teamCount is checked before teamSize and players", () => {
  for (const teamCount of [
    0,
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    "2",
    null,
    true,
    2n,
    -0
  ]) {
    assert.throws(() => splitTeams({ teamCount, teamSize: "no", players: null }), {
      name: "RangeError",
      message: TEAM_COUNT_MESSAGE
    });
  }
  assert.throws(() => splitTeams({ teamSize: 1, players: [] }), {
    name: "RangeError",
    message: TEAM_COUNT_MESSAGE
  });
  assert.equal(splitTeams({ teamCount: 1.0, teamSize: 1, players: [pair("a", 1)] }).spread, 0);
});

test("teamSize is checked before players", () => {
  for (const teamSize of [0, -1, 1.5, Number.NaN, Number.NEGATIVE_INFINITY, "1", null, false, 1n]) {
    assert.throws(() => splitTeams({ teamCount: 1, teamSize, players: null }), {
      name: "RangeError",
      message: TEAM_SIZE_MESSAGE
    });
  }
  assert.throws(() => splitTeams({ teamCount: 1, players: [pair("a", 1)] }), {
    name: "RangeError",
    message: TEAM_SIZE_MESSAGE
  });
});

test("players must be an array of player objects", () => {
  for (const players of [null, {}, "players", 1, true]) {
    assert.throws(() => splitTeams({ teamCount: 1, teamSize: 1, players }), {
      name: "TypeError",
      message: PLAYERS_MESSAGE
    });
  }
  assert.throws(() => splitTeams({ teamCount: 1, teamSize: 1 }), {
    name: "TypeError",
    message: PLAYERS_MESSAGE
  });
  for (const player of [null, [], "a", 1, undefined]) {
    assert.throws(() => splitTeams({ teamCount: 1, teamSize: 1, players: [player] }), {
      name: "TypeError",
      message: PLAYER_MESSAGE
    });
  }
  const hole = [pair("a", 1)];
  hole.length = 2;
  assert.throws(() => splitTeams({ teamCount: 1, teamSize: 2, players: hole }), {
    name: "TypeError",
    message: PLAYER_MESSAGE
  });
});

test("a player id must be a non-empty string and is read before the rating", () => {
  const inherited = Object.create({ id: "a" });
  inherited.rating = 1;
  for (const player of [{ rating: 1 }, { id: "", rating: 1 }, { id: 1, rating: 1 }, inherited]) {
    assert.throws(() => splitTeams({ teamCount: 1, teamSize: 1, players: [player] }), {
      name: "TypeError",
      message: PLAYER_ID_MESSAGE
    });
  }
  assert.throws(
    () => splitTeams({ teamCount: 1, teamSize: 1, players: [{ rating: Number.NaN }] }),
    {
      name: "TypeError",
      message: PLAYER_ID_MESSAGE
    }
  );
  const spaced = splitTeams({
    teamCount: 1,
    teamSize: 1,
    players: [pair(" ", 3)]
  });
  assert.deepEqual(spaced.teams[0].members, [" "]);
});

test("a player rating must be a finite number", () => {
  for (const rating of [
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    "1",
    null,
    undefined,
    true,
    false,
    1n
  ]) {
    assert.throws(() => splitTeams({ teamCount: 1, teamSize: 1, players: [pair("a", rating)] }), {
      name: "RangeError",
      message: PLAYER_RATING_MESSAGE
    });
  }
  const inherited = Object.create({ rating: 5 });
  inherited.id = "a";
  assert.throws(() => splitTeams({ teamCount: 1, teamSize: 1, players: [inherited] }), {
    name: "RangeError",
    message: PLAYER_RATING_MESSAGE
  });
  assert.throws(() => splitTeams({ teamCount: 1, teamSize: 1, players: [{ id: "a" }] }), {
    name: "RangeError",
    message: PLAYER_RATING_MESSAGE
  });
});

test("duplicate ids are rejected after each rating is known to be finite", () => {
  assert.throws(
    () =>
      splitTeams({
        teamCount: 1,
        teamSize: 2,
        players: [pair("a", 1), pair("a", Number.NaN)]
      }),
    {
      name: "RangeError",
      message: PLAYER_RATING_MESSAGE
    }
  );
  assert.throws(
    () =>
      splitTeams({
        teamCount: 1,
        teamSize: 2,
        players: [pair("a", 1), pair("a", 2)]
      }),
    {
      name: "TypeError",
      message: DUPLICATE_ID_MESSAGE
    }
  );
  assert.equal(
    splitTeams({
      teamCount: 2,
      teamSize: 1,
      players: [pair("a", 1), pair("A", 2)]
    }).teams.length,
    2
  );
});

test("negative zero ratings are stored as zero", () => {
  const result = splitTeams({
    teamCount: 1,
    teamSize: 2,
    players: [pair("a", -0), pair("b", -0)]
  });
  assert.equal(Object.is(result.teams[0].total, 0), true);
  assert.equal(Object.is(result.spread, 0), true);
});

test("parties must be an array of id lists", () => {
  const players = [pair("a", 1), pair("b", 1)];
  for (const parties of [null, {}, "ab", 1, true]) {
    assert.throws(() => splitTeams({ teamCount: 1, teamSize: 2, players, parties }), {
      name: "TypeError",
      message: PARTIES_MESSAGE
    });
  }
  for (const party of [null, {}, "ab", 1, undefined]) {
    assert.throws(() => splitTeams({ teamCount: 1, teamSize: 2, players, parties: [party] }), {
      name: "TypeError",
      message: PARTY_MESSAGE
    });
  }
});

test("a party must name at least two distinct players", () => {
  const players = [pair("a", 1), pair("b", 1), pair("c", 1)];
  for (const party of [[], ["a"]]) {
    assert.throws(() => splitTeams({ teamCount: 1, teamSize: 3, players, parties: [party] }), {
      name: "RangeError",
      message: PARTY_LENGTH_MESSAGE
    });
  }
  assert.throws(() => splitTeams({ teamCount: 1, teamSize: 2, players, parties: [[1]] }), {
    name: "RangeError",
    message: PARTY_LENGTH_MESSAGE
  });
  assert.throws(() => splitTeams({ teamCount: 1, teamSize: 2, players, parties: [[1, 2]] }), {
    name: "TypeError",
    message: PARTY_ID_MESSAGE
  });
  assert.throws(
    () => splitTeams({ teamCount: 1, teamSize: 2, players, parties: [["missing", "missing"]] }),
    {
      name: "TypeError",
      message: UNKNOWN_PLAYER_MESSAGE
    }
  );
  assert.throws(() => splitTeams({ teamCount: 1, teamSize: 2, players, parties: [["", "a"]] }), {
    name: "TypeError",
    message: UNKNOWN_PLAYER_MESSAGE
  });
  assert.throws(() => splitTeams({ teamCount: 1, teamSize: 2, players, parties: [["a", "a"]] }), {
    name: "TypeError",
    message: PARTY_ONCE_MESSAGE
  });
  assert.throws(
    () =>
      splitTeams({
        teamCount: 1,
        teamSize: 3,
        players,
        parties: [
          ["a", "b"],
          ["b", "c"]
        ]
      }),
    {
      name: "TypeError",
      message: PARTY_ONCE_MESSAGE
    }
  );
});

test("exactLimit is checked after parties and before party size", () => {
  const players = [pair("a", 1), pair("b", 1)];
  for (const exactLimit of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, "0", null, true, 1n]) {
    assert.throws(
      () =>
        splitTeams({
          teamCount: 1,
          teamSize: 1,
          players,
          parties: [["a", "b"]],
          exactLimit
        }),
      {
        name: "RangeError",
        message: EXACT_LIMIT_MESSAGE
      }
    );
  }
  const forced = splitTeams({
    teamCount: 1,
    teamSize: 1,
    players: [pair("a", 1)],
    exactLimit: -0
  });
  assert.equal(forced.method, "heuristic");
  assert.equal(Object.is(forced.spread, 0), true);
});

test("a party larger than teamSize is rejected before the slot count", () => {
  assert.throws(
    () =>
      splitTeams({
        teamCount: 2,
        teamSize: 1,
        players: [pair("a", 1), pair("b", 1), pair("c", 1)],
        parties: [["a", "b"]]
      }),
    {
      name: "RangeError",
      message: PARTY_SIZE_MESSAGE
    }
  );
  assert.doesNotThrow(() =>
    splitTeams({
      teamCount: 2,
      teamSize: 2,
      players: [pair("a", 1), pair("b", 2), pair("c", 3), pair("d", 4)],
      parties: [["b", "a"]]
    })
  );
});

test("the player count must equal teamCount times teamSize", () => {
  assert.throws(
    () =>
      splitTeams({
        teamCount: 2,
        teamSize: 2,
        players: [pair("a", 1)]
      }),
    {
      name: "RangeError",
      message: SLOT_MESSAGE
    }
  );
  assert.throws(
    () =>
      splitTeams({
        teamCount: 1,
        teamSize: 1,
        players: []
      }),
    {
      name: "RangeError",
      message: SLOT_MESSAGE
    }
  );
  assert.throws(
    () =>
      splitTeams({
        teamCount: Number.MAX_SAFE_INTEGER,
        teamSize: 2,
        players: [pair("a", 1)]
      }),
    {
      name: "RangeError",
      message: SLOT_MESSAGE
    }
  );
});

test("parties that cannot fill the teams are rejected", () => {
  const players = [
    pair("a", 1),
    pair("b", 1),
    pair("c", 1),
    pair("d", 1),
    pair("e", 1),
    pair("f", 1)
  ];
  const parties = [
    ["a", "b"],
    ["c", "d"],
    ["e", "f"]
  ];
  for (const exactLimit of [undefined, 0, 12]) {
    assert.throws(() => splitTeams({ teamCount: 2, teamSize: 3, players, parties, exactLimit }), {
      name: "RangeError",
      message: INFEASIBLE_MESSAGE
    });
  }
});

test("a non-finite team total or spread is rejected", () => {
  const overflow = [
    pair("a", Number.MAX_VALUE),
    pair("b", Number.MAX_VALUE),
    pair("c", Number.MAX_VALUE),
    pair("d", Number.MAX_VALUE)
  ];
  for (const exactLimit of [0, 12]) {
    assert.throws(() => splitTeams({ teamCount: 2, teamSize: 2, players: overflow, exactLimit }), {
      name: "RangeError",
      message: TOTAL_MESSAGE
    });
  }
  const wide = [pair("a", Number.MAX_VALUE), pair("b", -Number.MAX_VALUE)];
  for (const exactLimit of [0, 12]) {
    assert.throws(() => splitTeams({ teamCount: 2, teamSize: 1, players: wide, exactLimit }), {
      name: "RangeError",
      message: SPREAD_MESSAGE
    });
  }
});
