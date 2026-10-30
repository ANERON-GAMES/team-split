export function compareIds(left, right) {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

export function compareIdLists(left, right) {
  const count = left.length < right.length ? left.length : right.length;
  for (let index = 0; index < count; index += 1) {
    const compared = compareIds(left[index], right[index]);
    if (compared !== 0) {
      return compared;
    }
  }
  if (left.length < right.length) {
    return -1;
  }
  if (left.length > right.length) {
    return 1;
  }
  return 0;
}

export function compareNumberAscending(left, right) {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

export function compareNumberDescending(left, right) {
  return compareNumberAscending(right, left);
}

export function compareDraft(left, right) {
  const byRating = compareNumberDescending(left.rating, right.rating);
  if (byRating !== 0) {
    return byRating;
  }
  const bySize = compareNumberDescending(left.size, right.size);
  if (bySize !== 0) {
    return bySize;
  }
  return compareIdLists(left.ids, right.ids);
}

export function comparePacking(left, right) {
  const bySize = compareNumberDescending(left.size, right.size);
  if (bySize !== 0) {
    return bySize;
  }
  const byRating = compareNumberDescending(left.rating, right.rating);
  if (byRating !== 0) {
    return byRating;
  }
  return compareIdLists(left.ids, right.ids);
}

export function compareTeams(left, right) {
  const count = left.length < right.length ? left.length : right.length;
  for (let index = 0; index < count; index += 1) {
    const compared = compareIdLists(left[index].members, right[index].members);
    if (compared !== 0) {
      return compared;
    }
  }
  if (left.length < right.length) {
    return -1;
  }
  if (left.length > right.length) {
    return 1;
  }
  return 0;
}
