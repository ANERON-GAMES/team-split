import { comparePacking } from "./order.js";

function place(order, position, filled, assignment, teamSize) {
  if (position === order.length) {
    return true;
  }
  const unit = order[position];
  let usedEmpty = false;
  for (let team = 0; team < filled.length; team += 1) {
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
    assignment[unit.index] = team;
    if (place(order, position + 1, filled, assignment, teamSize)) {
      return true;
    }
    filled[team] -= unit.size;
  }
  return false;
}

export function packUnits(units, teamCount, teamSize) {
  const order = units.slice().sort(comparePacking);
  const filled = new Array(teamCount).fill(0);
  const assignment = new Array(units.length);
  if (!place(order, 0, filled, assignment, teamSize)) {
    return null;
  }
  return assignment;
}
