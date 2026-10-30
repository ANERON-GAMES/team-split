import { comparePacking } from "./order.js";
import { isBetter, materialize, safeToPrune } from "./result.js";

function fullTeamSpread(totals, filled, teamSize) {
  let max = null;
  let min = null;
  let full = 0;
  for (let team = 0; team < totals.length; team += 1) {
    if (!Number.isFinite(totals[team])) {
      return Number.POSITIVE_INFINITY;
    }
    if (filled[team] !== teamSize) {
      continue;
    }
    full += 1;
    if (max === null || totals[team] > max) {
      max = totals[team];
    }
    if (min === null || totals[team] < min) {
      min = totals[team];
    }
  }
  if (full < 2) {
    return 0;
  }
  return max - min;
}

export function solveExact(units, teamCount, teamSize) {
  const order = units.slice().sort(comparePacking);
  const filled = new Array(teamCount).fill(0);
  const totals = new Array(teamCount).fill(0);
  const assignment = new Array(units.length);
  const prune = safeToPrune(units, teamSize);
  let best = null;

  function visit(position) {
    if (position === order.length) {
      const candidate = materialize(units, assignment, teamCount);
      if (best === null || isBetter(candidate, best)) {
        best = candidate;
      }
      return;
    }
    if (prune && best !== null && Number.isFinite(best.spread)) {
      const bound = fullTeamSpread(totals, filled, teamSize);
      if (bound > best.spread) {
        return;
      }
    }
    const unit = order[position];
    let usedEmpty = false;
    for (let team = 0; team < teamCount; team += 1) {
      if (filled[team] === 0) {
        if (usedEmpty) {
          continue;
        }
        usedEmpty = true;
      }
      if (filled[team] + unit.size > teamSize) {
        continue;
      }
      filled[team] += unit.size;
      totals[team] += unit.rating;
      assignment[unit.index] = team;
      visit(position + 1);
      filled[team] -= unit.size;
      totals[team] -= unit.rating;
    }
  }

  visit(0);
  return best;
}
