import assert from "node:assert/strict";
import test from "node:test";
import { splitTeams } from "../src/index.js";
import { assertParties, assertSplit, shuffle, createRandom } from "./helpers.js";

const SIX = [
  { id: "a", rating: 10 },
  { id: "b", rating: 9 },
  { id: "c", rating: 8 },
  { id: "d", rating: 7 },
  { id: "e", rating: 6 },
  { id: "f", rating: 5 }
];

test("six players split into the lexicographically smallest spread of 1", () => {
  const result = splitTeams({
    teamCount: 2,
    teamSize: 3,
    players: SIX
  });
  assert.equal(result.method, "exact");
  assert.deepEqual(result.teams[0].members, ["a", "c", "f"]);
  assert.equal(result.teams[0].total, 23);
  assert.deepEqual(result.teams[1].members, ["b", "d", "e"]);
  assert.equal(result.teams[1].total, 22);
  assert.equal(result.spread, 1);
  assertSplit(result, SIX, 2, 3);
  assert.deepEqual(splitTeams({ teamCount: 2, teamSize: 3, players: SIX }), result);
});

test("a party stays together and the solo that minimises spread joins it", () => {
  const players = [
    { id: "a", rating: 10 },
    { id: "b", rating: 9 },
    { id: "c", rating: 8 },
    { id: "d", rating: 1 },
    { id: "e", rating: 7 },
    { id: "f", rating: 6 }
  ];
  const parties = [["a", "b"]];
  const grouped = splitTeams({
    teamCount: 2,
    teamSize: 3,
    players,
    parties
  });
  assert.deepEqual(grouped.teams[0].members, ["a", "b", "d"]);
  assert.equal(grouped.teams[0].total, 20);
  assert.deepEqual(grouped.teams[1].members, ["c", "e", "f"]);
  assert.equal(grouped.teams[1].total, 21);
  assert.equal(grouped.spread, 1);
  assert.equal(grouped.method, "exact");
  assertParties(grouped, parties);
  assertSplit(grouped, players, 2, 3);
});

test("three teams of two use the unique spread of 1", () => {
  const players = [
    { id: "a", rating: 9 },
    { id: "b", rating: 8 },
    { id: "c", rating: 7 },
    { id: "d", rating: 4 },
    { id: "e", rating: 3 },
    { id: "f", rating: 1 }
  ];
  const trio = splitTeams({
    teamCount: 3,
    teamSize: 2,
    players
  });
  assert.deepEqual(trio.teams[0].members, ["a", "f"]);
  assert.equal(trio.teams[0].total, 10);
  assert.deepEqual(trio.teams[1].members, ["b", "e"]);
  assert.equal(trio.teams[1].total, 11);
  assert.deepEqual(trio.teams[2].members, ["c", "d"]);
  assert.equal(trio.teams[2].total, 11);
  assert.equal(trio.spread, 1);
  assert.equal(trio.method, "exact");
  assertSplit(trio, players, 3, 2);
});

test("exactLimit 0 uses the heuristic and returns the same six-player split", () => {
  const heuristic = splitTeams({
    teamCount: 2,
    teamSize: 3,
    players: SIX,
    exactLimit: 0
  });
  const result = splitTeams({
    teamCount: 2,
    teamSize: 3,
    players: SIX
  });
  assert.equal(heuristic.method, "heuristic");
  assert.equal(heuristic.spread, 1);
  assert.deepEqual(heuristic.teams, result.teams);
});

test("input order does not change the split and the input is not mutated", () => {
  const players = SIX.map((player) => ({ ...player }));
  const parties = [["f", "a"]];
  const before = {
    players: players.map((player) => ({ ...player })),
    parties: parties.map((party) => party.slice())
  };
  const random = createRandom(11);
  const first = splitTeams({
    teamCount: 2,
    teamSize: 3,
    players,
    parties
  });
  const second = splitTeams({
    teamCount: 2,
    teamSize: 3,
    players: shuffle(players, random),
    parties: [shuffle(parties[0], random)]
  });
  assert.deepEqual(second, first);
  assert.deepEqual(players, before.players);
  assert.deepEqual(parties, before.parties);
  assertParties(first, parties);
  assert.equal(first.spread, 1);
  assert.deepEqual(first.teams[0].members, ["a", "c", "f"]);
});

test("equal ratings produce spread 0 and the lexicographically smallest teams", () => {
  const players = [
    { id: "d", rating: 5 },
    { id: "a", rating: 5 },
    { id: "c", rating: 5 },
    { id: "b", rating: 5 }
  ];
  const result = splitTeams({ teamCount: 2, teamSize: 2, players });
  assert.deepEqual(result.teams[0].members, ["a", "b"]);
  assert.deepEqual(result.teams[1].members, ["c", "d"]);
  assert.equal(result.spread, 0);
  assert.equal(result.teams[0].total, 10);
});

test("negative ratings can cancel to a spread of 0", () => {
  const players = [
    { id: "a", rating: -5 },
    { id: "b", rating: -1 },
    { id: "c", rating: 0 },
    { id: "d", rating: 4 }
  ];
  const result = splitTeams({ teamCount: 2, teamSize: 2, players });
  assert.deepEqual(result.teams[0].members, ["a", "d"]);
  assert.equal(result.teams[0].total, -1);
  assert.deepEqual(result.teams[1].members, ["b", "c"]);
  assert.equal(result.teams[1].total, -1);
  assert.equal(result.spread, 0);
});

test("one team and one seat per team are ordered by code units", () => {
  const alone = splitTeams({
    teamCount: 1,
    teamSize: 3,
    players: [
      { id: "c", rating: 1 },
      { id: "a", rating: 2 },
      { id: "b", rating: 3 }
    ]
  });
  assert.deepEqual(alone.teams[0].members, ["a", "b", "c"]);
  assert.equal(alone.spread, 0);
  assert.equal(alone.teams[0].total, 6);

  const seats = splitTeams({
    teamCount: 3,
    teamSize: 1,
    players: [
      { id: "b", rating: 1 },
      { id: "A", rating: 9 },
      { id: "a", rating: 3 }
    ]
  });
  assert.deepEqual(
    seats.teams.map((team) => team.members[0]),
    ["A", "a", "b"]
  );
  assert.deepEqual(
    seats.teams.map((team) => team.total),
    [9, 3, 1]
  );
  assert.equal(seats.spread, 8);
  assert.equal("z" < "ä", true);
  const letters = splitTeams({
    teamCount: 2,
    teamSize: 1,
    players: [
      { id: "ä", rating: 1 },
      { id: "z", rating: 4 }
    ]
  });
  assert.deepEqual(
    letters.teams.map((team) => team.members[0]),
    ["z", "ä"]
  );
  assert.equal(letters.spread, 3);
});

test("a team total adds ratings in sorted member id order", () => {
  const players = [
    { id: "c", rating: 0.3 },
    { id: "a", rating: 0.1 },
    { id: "b", rating: 0.2 }
  ];
  let total = 0;
  total += 0.1;
  total += 0.2;
  total += 0.3;
  const result = splitTeams({ teamCount: 1, teamSize: 3, players });
  assert.deepEqual(result.teams[0].members, ["a", "b", "c"]);
  assert.equal(result.teams[0].total, total);
  assert.equal(result.spread, 0);
});

test("binary fractions that cancel are paired", () => {
  const players = [
    { id: "a", rating: 0.5 },
    { id: "b", rating: 0.25 },
    { id: "c", rating: 0.25 },
    { id: "d", rating: 0 }
  ];
  const result = splitTeams({ teamCount: 2, teamSize: 2, players });
  assert.deepEqual(result.teams[0].members, ["a", "d"]);
  assert.deepEqual(result.teams[1].members, ["b", "c"]);
  assert.equal(result.teams[0].total, 0.5);
  assert.equal(result.teams[1].total, 0.5);
  assert.equal(result.spread, 0);
});

test("finite halves of large magnitudes stay finite", () => {
  const players = [
    { id: "a", rating: Number.MAX_VALUE },
    { id: "b", rating: Number.MAX_VALUE },
    { id: "c", rating: 0 },
    { id: "d", rating: 0 }
  ];
  const result = splitTeams({ teamCount: 2, teamSize: 2, players });
  assert.deepEqual(result.teams[0].members, ["a", "c"]);
  assert.deepEqual(result.teams[1].members, ["b", "d"]);
  assert.equal(result.teams[0].total, Number.MAX_VALUE);
  assert.equal(result.spread, 0);
  const mixed = splitTeams({
    teamCount: 2,
    teamSize: 2,
    players: [
      { id: "a", rating: Number.MAX_VALUE },
      { id: "b", rating: -Number.MAX_VALUE },
      { id: "c", rating: 0 },
      { id: "d", rating: 0 }
    ]
  });
  assert.equal(mixed.spread, 0);
  assert.equal(mixed.teams[0].total, 0);
  assert.equal(mixed.teams[1].total, 0);
});

test("the returned objects are frozen", () => {
  const result = splitTeams({
    teamCount: 1,
    teamSize: 1,
    players: [{ id: "a", rating: 1 }]
  });
  assert.throws(() => {
    result.spread = 4;
  }, TypeError);
  assert.throws(() => {
    result.teams[0].total = 4;
  }, TypeError);
  assert.throws(() => {
    result.teams[0].members[0] = "z";
  }, TypeError);
  assert.throws(() => {
    result.teams.push(result.teams[0]);
  }, TypeError);
});

test("calls do not share state", () => {
  const first = splitTeams({
    teamCount: 2,
    teamSize: 1,
    players: [
      { id: "a", rating: 3 },
      { id: "b", rating: 1 }
    ]
  });
  const other = splitTeams({
    teamCount: 1,
    teamSize: 2,
    players: [
      { id: "a", rating: 8 },
      { id: "b", rating: 8 }
    ],
    parties: [["b", "a"]]
  });
  const again = splitTeams({
    teamCount: 2,
    teamSize: 1,
    players: [
      { id: "a", rating: 3 },
      { id: "b", rating: 1 }
    ]
  });
  assert.equal(other.spread, 0);
  assert.deepEqual(other.teams[0].members, ["a", "b"]);
  assert.deepEqual(again, first);
});

test("method selection follows the unit count and the combination budget", () => {
  function players(count) {
    const list = [];
    for (let index = 0; index < count; index += 1) {
      list.push({ id: "p" + String(index).padStart(2, "0"), rating: index + 1 });
    }
    return list;
  }

  const twoBySix = splitTeams({ teamCount: 2, teamSize: 6, players: players(12) });
  assert.equal(twoBySix.method, "exact");
  assertSplit(twoBySix, players(12), 2, 6);

  const lowered = splitTeams({
    teamCount: 2,
    teamSize: 6,
    players: players(12),
    exactLimit: 11
  });
  assert.equal(lowered.method, "heuristic");
  assert.equal(lowered.spread < twoBySix.spread, false);

  const twoBySeven = splitTeams({ teamCount: 2, teamSize: 7, players: players(14) });
  assert.equal(twoBySeven.method, "heuristic");
  assertSplit(twoBySeven, players(14), 2, 7);

  const threeByFour = splitTeams({ teamCount: 3, teamSize: 4, players: players(12) });
  assert.equal(threeByFour.method, "exact");
  assertSplit(threeByFour, players(12), 3, 4);

  const fourByThree = splitTeams({ teamCount: 4, teamSize: 3, players: players(12) });
  assert.equal(fourByThree.method, "heuristic");
  assertSplit(fourByThree, players(12), 4, 3);

  const threeByThree = splitTeams({ teamCount: 3, teamSize: 3, players: players(9) });
  assert.equal(threeByThree.method, "exact");
  assert.equal(threeByThree.spread, 0);
});

test("a feasible party layout that the drafts miss still fills the teams", () => {
  const players = [];
  const parties = [];
  const sizes = [2, 2, 2, 3, 3];
  let next = 0;
  for (let sizeIndex = 0; sizeIndex < sizes.length; sizeIndex += 1) {
    const ids = [];
    for (let offset = 0; offset < sizes[sizeIndex]; offset += 1) {
      const id = "p" + String(next).padStart(2, "0");
      next += 1;
      players.push({ id, rating: sizes[sizeIndex] * 10 + offset });
      ids.push(id);
    }
    parties.push(ids);
  }
  const heuristic = splitTeams({
    teamCount: 2,
    teamSize: 6,
    players,
    parties,
    exactLimit: 0
  });
  const exact = splitTeams({
    teamCount: 2,
    teamSize: 6,
    players,
    parties
  });
  assert.equal(heuristic.method, "heuristic");
  assert.equal(exact.method, "exact");
  assert.equal(heuristic.spread, 63);
  assert.equal(exact.spread, 63);
  assert.deepEqual(heuristic.teams, exact.teams);
  assertParties(heuristic, parties);
  assertSplit(heuristic, players, 2, 6);
});

test("a larger heuristic match stays valid across two calls", () => {
  const players = [];
  for (let index = 0; index < 60; index += 1) {
    players.push({
      id: "p" + String(index).padStart(2, "0"),
      rating: (index * 13) % 100
    });
  }
  const parties = [
    ["p00", "p01"],
    ["p10", "p11", "p12"]
  ];
  const first = splitTeams({
    teamCount: 6,
    teamSize: 10,
    players,
    parties
  });
  const second = splitTeams({
    teamCount: 6,
    teamSize: 10,
    players: players.slice().reverse(),
    parties: [
      ["p12", "p10", "p11"],
      ["p01", "p00"]
    ]
  });
  assert.equal(first.method, "heuristic");
  assert.deepEqual(second, first);
  assertSplit(first, players, 6, 10);
  assertParties(first, parties);
  assert.equal(Number.isFinite(first.spread), true);
});
