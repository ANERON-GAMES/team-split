import assert from "node:assert/strict";
import test from "node:test";
import { EXACT, HEURISTIC, splitTeams } from "../src/index.js";
import { assertParties, assertSplit, createRandom, shuffle } from "./helpers.js";

function makeCase(random) {
  const teamCount = random() < 0.65 ? 2 : 3;
  const teamSize = 2 + Math.floor(random() * 3);
  const count = teamCount * teamSize;
  const players = [];
  for (let index = 0; index < count; index += 1) {
    players.push({
      id: "p" + String(index).padStart(2, "0"),
      rating: Math.floor(random() * 41)
    });
  }
  const parties = [];
  if (random() < 0.55) {
    parties.push(["p01", "p00"]);
    if (count >= 6 && random() < 0.35) {
      parties.push(["p03", "p02"]);
    }
  }
  return { teamCount, teamSize, players, parties };
}

test("seeded small cases keep the heuristic spread at the exact spread", () => {
  const random = createRandom(20261030);
  const shuffler = createRandom(99);
  for (let index = 0; index < 40; index += 1) {
    const sample = makeCase(random);
    const exact = splitTeams({ ...sample, exactLimit: 24 });
    const heuristic = splitTeams({ ...sample, exactLimit: 0 });
    assert.equal(exact.method, EXACT);
    assert.equal(heuristic.method, HEURISTIC);
    assert.equal(heuristic.spread < exact.spread, false);
    assert.equal(heuristic.spread, exact.spread);
    assertSplit(exact, sample.players, sample.teamCount, sample.teamSize);
    assertSplit(heuristic, sample.players, sample.teamCount, sample.teamSize);
    assertParties(exact, sample.parties);
    assertParties(heuristic, sample.parties);
    assert.deepEqual(splitTeams({ ...sample, exactLimit: 0 }), heuristic);
    const shuffled = splitTeams({
      teamCount: sample.teamCount,
      teamSize: sample.teamSize,
      players: shuffle(sample.players, shuffler),
      parties: shuffle(sample.parties, shuffler).map((party) => shuffle(party, shuffler)),
      exactLimit: 0
    });
    assert.deepEqual(shuffled, heuristic);
  }
});

test("a second seed never lets the heuristic beat the exact spread", () => {
  const random = createRandom(1);
  let compared = 0;
  let matched = 0;
  for (let index = 0; index < 30; index += 1) {
    const sample = makeCase(random);
    const exact = splitTeams({ ...sample, exactLimit: 24 });
    const heuristic = splitTeams({ ...sample, exactLimit: 0 });
    assert.equal(exact.method, EXACT);
    assert.equal(heuristic.method, HEURISTIC);
    assert.equal(heuristic.spread < exact.spread, false);
    assert.equal(heuristic.spread - exact.spread <= 1, true);
    compared += 1;
    if (heuristic.spread === exact.spread) {
      matched += 1;
    }
  }
  assert.equal(compared, 30);
  assert.equal(matched >= 29, true);
});
