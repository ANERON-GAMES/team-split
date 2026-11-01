import { EXACT, HEURISTIC, MAX_EXACT_COMBINATIONS } from "./constants.js";
import { solveExact } from "./exact.js";
import { solveHeuristic } from "./heuristic.js";
import { buildUnits } from "./units.js";
import { readInput } from "./validate.js";

const INFEASIBLE_MESSAGE = "parties cannot be placed into the teams";
const TOTAL_MESSAGE = "team total must be finite";
const SPREAD_MESSAGE = "spread must be finite";

function combinationsExceed(teamCount, unitCount) {
  let product = 1;
  for (let step = 0; step < unitCount; step += 1) {
    product *= teamCount;
    if (product > MAX_EXACT_COMBINATIONS) {
      return true;
    }
  }
  return false;
}

function finish(solved) {
  if (solved === null) {
    throw new RangeError(INFEASIBLE_MESSAGE);
  }
  for (let index = 0; index < solved.teams.length; index += 1) {
    if (!Number.isFinite(solved.teams[index].total)) {
      throw new RangeError(TOTAL_MESSAGE);
    }
  }
  if (!Number.isFinite(solved.spread)) {
    throw new RangeError(SPREAD_MESSAGE);
  }
  return solved;
}

export function splitTeams(input) {
  const spec = readInput(input);
  const units = buildUnits(spec.players, spec.parties);
  const method =
    units.length <= spec.exactLimit && !combinationsExceed(spec.teamCount, units.length)
      ? EXACT
      : HEURISTIC;
  const solved =
    method === EXACT
      ? finish(solveExact(units, spec.teamCount, spec.teamSize))
      : finish(solveHeuristic(units, spec.teamCount, spec.teamSize));
  return Object.freeze({
    teams: solved.teams,
    spread: solved.spread,
    method
  });
}
