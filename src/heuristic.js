import { compareDraft } from "./order.js";
import { packUnits } from "./pack.js";
import { isBetter, materialize } from "./result.js";

const DOUBLE_SWAP_LIMIT = 16;

function lowestTotal(units, teamCount, teamSize) {
  const order = units.slice().sort(compareDraft);
  const filled = new Array(teamCount).fill(0);
  const totals = new Array(teamCount).fill(0);
  const assignment = new Array(units.length);
  for (let index = 0; index < order.length; index += 1) {
    const unit = order[index];
    let chosen = -1;
    for (let team = 0; team < teamCount; team += 1) {
      if (filled[team] + unit.size > teamSize) {
        continue;
      }
      if (chosen === -1 || totals[team] < totals[chosen]) {
        chosen = team;
      }
    }
    if (chosen === -1) {
      return null;
    }
    assignment[unit.index] = chosen;
    filled[chosen] += unit.size;
    totals[chosen] += unit.rating;
  }
  return assignment;
}

function draft(units, teamCount, teamSize) {
  const remaining = units.slice().sort(compareDraft);
  const filled = new Array(teamCount).fill(0);
  const assignment = new Array(units.length);
  let round = 0;
  while (remaining.length > 0) {
    const reverse = round % 2 === 1;
    let placed = 0;
    for (let step = 0; step < teamCount; step += 1) {
      const team = reverse ? teamCount - 1 - step : step;
      const room = teamSize - filled[team];
      if (room <= 0) {
        continue;
      }
      let found = -1;
      for (let index = 0; index < remaining.length; index += 1) {
        if (remaining[index].size <= room) {
          found = index;
          break;
        }
      }
      if (found === -1) {
        continue;
      }
      const unit = remaining[found];
      remaining.splice(found, 1);
      assignment[unit.index] = team;
      filled[team] += unit.size;
      placed += 1;
    }
    if (placed === 0) {
      return null;
    }
    round += 1;
  }
  return assignment;
}

function groupsFor(units, assignment, teamCount) {
  const groups = [];
  for (let team = 0; team < teamCount; team += 1) {
    groups.push([]);
  }
  for (let index = 0; index < units.length; index += 1) {
    groups[assignment[units[index].index]].push(units[index]);
  }
  return groups;
}

function sameAssignment(left, right) {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}

function improvesSpread(candidate, incumbent) {
  return candidate.spread < incumbent.spread;
}

function firstDouble(units, assignment, teamCount, current) {
  for (let firstIndex = 0; firstIndex < units.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < units.length; secondIndex += 1) {
      const first = units[firstIndex];
      const second = units[secondIndex];
      if (first.size !== second.size) {
        continue;
      }
      const firstTeam = assignment[first.index];
      const secondTeam = assignment[second.index];
      if (firstTeam === secondTeam) {
        continue;
      }
      for (let thirdIndex = firstIndex + 1; thirdIndex < units.length; thirdIndex += 1) {
        if (thirdIndex === secondIndex) {
          continue;
        }
        for (let fourthIndex = thirdIndex + 1; fourthIndex < units.length; fourthIndex += 1) {
          if (fourthIndex === secondIndex) {
            continue;
          }
          const third = units[thirdIndex];
          const fourth = units[fourthIndex];
          if (third.size !== fourth.size) {
            continue;
          }
          const thirdTeam = assignment[third.index];
          const fourthTeam = assignment[fourth.index];
          if (thirdTeam === fourthTeam) {
            continue;
          }
          assignment[first.index] = secondTeam;
          assignment[second.index] = firstTeam;
          assignment[third.index] = fourthTeam;
          assignment[fourth.index] = thirdTeam;
          const candidate = materialize(units, assignment, teamCount);
          if (improvesSpread(candidate, current)) {
            return candidate;
          }
          assignment[first.index] = firstTeam;
          assignment[second.index] = secondTeam;
          assignment[third.index] = thirdTeam;
          assignment[fourth.index] = fourthTeam;
        }
      }
    }
  }
  return null;
}

function improve(units, assignment, teamCount) {
  let current = materialize(units, assignment, teamCount);
  let moved = true;
  while (moved) {
    const single = firstImprovement(units, assignment, teamCount, current);
    if (single !== null) {
      current = single;
      continue;
    }
    if (units.length <= DOUBLE_SWAP_LIMIT) {
      const doubled = firstDouble(units, assignment, teamCount, current);
      if (doubled !== null) {
        current = doubled;
        continue;
      }
    }
    moved = false;
  }
  return current;
}

function firstImprovement(units, assignment, teamCount, current) {
  const groups = groupsFor(units, assignment, teamCount);
  for (let left = 0; left < teamCount; left += 1) {
    for (let right = left + 1; right < teamCount; right += 1) {
      const leftUnits = groups[left];
      const rightUnits = groups[right];
      for (let leftIndex = 0; leftIndex < leftUnits.length; leftIndex += 1) {
        for (let rightIndex = 0; rightIndex < rightUnits.length; rightIndex += 1) {
          const first = leftUnits[leftIndex];
          const second = rightUnits[rightIndex];
          if (first.size !== second.size) {
            continue;
          }
          assignment[first.index] = right;
          assignment[second.index] = left;
          const candidate = materialize(units, assignment, teamCount);
          if (isBetter(candidate, current)) {
            return candidate;
          }
          assignment[first.index] = left;
          assignment[second.index] = right;
        }
      }
    }
  }
  return null;
}

export function solveHeuristic(units, teamCount, teamSize) {
  const seeds = [];
  const drafted = draft(units, teamCount, teamSize);
  if (drafted !== null) {
    seeds.push(drafted);
  }
  const greedy = lowestTotal(units, teamCount, teamSize);
  if (greedy !== null && (drafted === null || !sameAssignment(drafted, greedy))) {
    seeds.push(greedy);
  }
  if (seeds.length === 0) {
    const packed = packUnits(units, teamCount, teamSize);
    if (packed === null) {
      return null;
    }
    seeds.push(packed);
  }
  let best = null;
  for (let index = 0; index < seeds.length; index += 1) {
    const improved = improve(units, seeds[index].slice(), teamCount);
    if (best === null || isBetter(improved, best)) {
      best = improved;
    }
  }
  return best;
}
