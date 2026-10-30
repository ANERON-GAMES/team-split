# @aneron/team-split

Deterministic team balancing that splits rated players into teams with minimal rating spread.

## Purpose

`@aneron/team-split` assigns players to a fixed number of equal-sized teams. Each player has an id and a numeric rating. Optional parties are groups of player ids that must stay on the same team. The split minimises the spread between the team rating totals. When two splits have the same spread, the lexicographically smaller member lists win, so the same players, parties, team count, and team size always produce the same teams.

Small inputs are solved by an exact search. Larger inputs use a deterministic heuristic: a snake draft, a lowest-total placement, pairwise swaps, and, for up to 16 units, a pair of disjoint swaps. The caller chooses the unit-count limit that separates the two.

The function does not read a clock, start a timer, draw random numbers, or touch the network or the filesystem. It has no runtime dependencies.

## Install

The package is an ES module. It needs Node.js 20 or newer.

```bash
npm install @aneron/team-split
```

Clone this repository and run the tests:

```bash
git clone https://github.com/ANERON-GAMES/team-split.git
cd team-split
npm install
npm test
```

`npm test` runs `node --test`. `npm run lint` runs ESLint. `npm run format:check` runs Prettier.

```js
import { splitTeams } from "@aneron/team-split";
```

Code in this repository imports the same entry point with `./src/index.js`.

## Usage

```js
import { splitTeams } from "@aneron/team-split";

const result = splitTeams({
  teamCount: 2,
  teamSize: 3,
  players: [
    { id: "a", rating: 10 },
    { id: "b", rating: 9 },
    { id: "c", rating: 8 },
    { id: "d", rating: 7 },
    { id: "e", rating: 6 },
    { id: "f", rating: 5 }
  ]
});
```

`result.teams[0].members` is `["a", "c", "f"]` and `result.teams[0].total` is `23`. `result.teams[1].members` is `["b", "d", "e"]` and `result.teams[1].total` is `22`. `result.spread` is `1`. `result.method` is `"exact"`.

A party is one unit. The other seats on that team are filled by players who are not in a party:

```js
const grouped = splitTeams({
  teamCount: 2,
  teamSize: 3,
  players: [
    { id: "a", rating: 10 },
    { id: "b", rating: 9 },
    { id: "c", rating: 8 },
    { id: "d", rating: 1 },
    { id: "e", rating: 7 },
    { id: "f", rating: 6 }
  ],
  parties: [["a", "b"]]
});
```

`grouped.teams[0].members` is `["a", "b", "d"]` and `grouped.teams[0].total` is `20`. `grouped.teams[1].members` is `["c", "e", "f"]` and `grouped.teams[1].total` is `21`. `grouped.spread` is `1`. `a` and `b` stay together.

The same rules apply to more than two teams:

```js
const trio = splitTeams({
  teamCount: 3,
  teamSize: 2,
  players: [
    { id: "a", rating: 9 },
    { id: "b", rating: 8 },
    { id: "c", rating: 7 },
    { id: "d", rating: 4 },
    { id: "e", rating: 3 },
    { id: "f", rating: 1 }
  ]
});
```

`trio.teams[0].members` is `["a", "f"]` and `trio.teams[0].total` is `10`. `trio.teams[1].members` is `["b", "e"]` and `trio.teams[1].total` is `11`. `trio.teams[2].members` is `["c", "d"]` and `trio.teams[2].total` is `11`. `trio.spread` is `1`.

`exactLimit: 0` forces the heuristic on that same six-player input:

```js
const heuristic = splitTeams({
  teamCount: 2,
  teamSize: 3,
  exactLimit: 0,
  players: [
    { id: "a", rating: 10 },
    { id: "b", rating: 9 },
    { id: "c", rating: 8 },
    { id: "d", rating: 7 },
    { id: "e", rating: 6 },
    { id: "f", rating: 5 }
  ]
});
```

`heuristic.method` is `"heuristic"`. `heuristic.spread` is `1`. `heuristic.teams` has the same members and totals as `result.teams`.

Three parties of two players cannot fill two teams of three. That call throws `RangeError` with the message `parties cannot be placed into the teams`.

## API

### Constants

| Export                   | Value         |
| ------------------------ | ------------- |
| `DEFAULT_EXACT_LIMIT`    | `12`          |
| `MAX_EXACT_COMBINATIONS` | `1048576`     |
| `EXACT`                  | `"exact"`     |
| `HEURISTIC`              | `"heuristic"` |

`METHODS` is a frozen array of the two method strings, in the order `exact`, `heuristic`.

`MAX_EXACT_COMBINATIONS` is `2` to the power `20`.

### `splitTeams(input)`

Split one lobby. `input` must be an object and must not be an array. Otherwise the function throws `TypeError` with the message `input must be an object`.

Own fields are read. An inherited field is not read. Unknown fields are ignored. A frozen object and an object with a null prototype are accepted. The input arrays and objects are not mutated.

| Field        | Required | Accepted values                                                                 |
| ------------ | -------- | ------------------------------------------------------------------------------- |
| `teamCount`  | yes      | A safe integer greater than or equal to `1`.                                    |
| `teamSize`   | yes      | A safe integer greater than or equal to `1`.                                    |
| `players`    | yes      | An array of player objects. The length must equal `teamCount * teamSize`.       |
| `parties`    | no       | An array of parties. Omitted, or own value `undefined`, means no parties.       |
| `exactLimit` | no       | A safe integer greater than or equal to `0`. Omitted or `undefined` means `12`. |

`-0` is accepted for `exactLimit` and is stored as `0`. `-0` is not a valid `teamCount` or `teamSize`.

Checks run in this order. The first failure wins.

1. `input` is an object.
2. `teamCount` is a safe integer greater than or equal to `1`. Otherwise `RangeError`: `teamCount must be an integer greater than or equal to 1`.
3. `teamSize` is a safe integer greater than or equal to `1`. Otherwise `RangeError`: `teamSize must be an integer greater than or equal to 1`.
4. `players` is an array. Otherwise `TypeError`: `players must be an array`.
5. Each player is validated, in array order.
6. `parties` is validated. A missing field or an own value of `undefined` is an empty list. Any other non-array throws `TypeError`: `parties must be an array`.
7. `exactLimit` is a safe integer greater than or equal to `0`, or it is missing or `undefined`. Otherwise `RangeError`: `exactLimit must be an integer greater than or equal to 0`.
8. Each party length is less than or equal to `teamSize`. Otherwise `RangeError`: `party must contain at most teamSize player ids`.
9. `teamCount * teamSize` is a safe integer and equals `players.length`. Otherwise `RangeError`: `player count must equal teamCount * teamSize`.
10. The parties can be placed into the teams. Otherwise `RangeError`: `parties cannot be placed into the teams`.
11. Every team total is finite. Otherwise `RangeError`: `team total must be finite`.
12. The spread is finite. Otherwise `RangeError`: `spread must be finite`.

### Players

A player must be an object and must not be an array. Otherwise `TypeError`: `player must be an object`. A hole in the array fails this check.

| Field    | Required | Meaning                                                                                  |
| -------- | -------- | ---------------------------------------------------------------------------------------- |
| `id`     | yes      | A string with length at least `1`. It is not trimmed. Comparison is case-sensitive.      |
| `rating` | yes      | A finite number. `-0` is stored as `0`. `Infinity`, `-Infinity`, and `NaN` are rejected. |

Unknown player fields are ignored. `id` and `rating` must be own fields.

`id` is checked before `rating`. A missing or invalid id throws `TypeError`: `player id must be a non-empty string`. A missing or non-finite rating throws `RangeError`: `player rating must be a finite number`. After the rating is accepted, a repeated id throws `TypeError`: `player id must be unique`.

Ids are ordered by UTF-16 code units, using `<` and `>` on the strings. The order does not depend on a locale.

### Parties

A party must be an array. Otherwise `TypeError`: `party must be an array`.

A party must contain at least `2` ids. Otherwise `RangeError`: `party must contain at least 2 player ids`. This length check runs before the id type check, so `[1]` fails the length check.

Each entry is then checked in order:

1. The id is a string. Otherwise `TypeError`: `party id must be a string`.
2. The id equals a player id. Otherwise `TypeError`: `party id must name a player`.
3. The id has not already appeared in this party or in an earlier party. Otherwise `TypeError`: `party id must appear once`.

The order of ids inside a party does not change the split. The order of parties does not change the split. A party whose length equals `teamSize` fills one team by itself.

### Result

The return value is a frozen object:

| Field    | Meaning                                                                        |
| -------- | ------------------------------------------------------------------------------ |
| `teams`  | A frozen array of frozen team objects.                                         |
| `spread` | The largest team total minus the smallest team total. `-0` is returned as `0`. |
| `method` | `"exact"` or `"heuristic"`.                                                    |

Each team object has:

| Field     | Meaning                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------- |
| `members` | A frozen array of player ids, sorted by code unit.                                                      |
| `total`   | The sum of those members' stored ratings, added from the first sorted id through the last. `-0` is `0`. |

`teams` itself is sorted by comparing those member arrays lexicographically. The team whose member list is smaller comes first. Draft seat numbers are not the output order.

`spread` uses those totals. For safe-integer ratings whose absolute values fit in `teamSize` times the largest absolute rating as a safe integer, the sum does not depend on addition order. For other finite ratings, the sorted-id order is the definition.

### Method selection

A unit is one party, or one player who is in no party. The unit count is `parties.length` plus the number of ungrouped players.

`method` is `"exact"` when both of these hold:

- the unit count is less than or equal to `exactLimit`
- a product that starts at `1` and is multiplied by `teamCount` once per unit never becomes greater than `1048576`

Otherwise `method` is `"heuristic"`. `2` to the power `20` is `1048576`, so that product is still allowed. The next multiplication selects the heuristic.

`exactLimit: 0` selects the heuristic for every non-empty lobby. Raising `exactLimit` does not force an exact search once the product would exceed `1048576`. Twelve solo players in two teams of six stay on the exact search at the default limit (`2` to the power `12` is `4096`). Twelve solo players in four teams of three use the heuristic (`4` to the power `12` is greater than `1048576`).

## Design

The objective is the spread, the largest team total minus the smallest. A smaller spread wins. If the spreads are equal, the sorted team list that is lexicographically smaller wins. Member ids inside a team are already sorted, and the teams are already sorted, before that comparison. There is no second rating objective. Two splits with the same spread and the same member lists are the same result.

Ratings may be negative. A negative rating lowers its team total. The search does not assume that ratings are positive.

### Units

Parties are sorted by their sorted member lists. Ungrouped players are sorted by id and follow the parties. That sequence assigns each unit an index, starting at `0`. The index does not depend on the input order.

A party's draft rating is the sum of its members' stored ratings in sorted id order. Its size is the number of members. A solo unit has size `1` and that player's stored rating.

### Exact search

The exact search places every unit on a seat. Seats are indexes `0` through `teamCount - 1`. A unit is placed only when the seat has enough free player slots left. Units are tried in packing order: larger size first, then higher draft rating, then the member list ascending.

At each step only one empty seat is tried, the empty seat with the lowest index. Empty seats are interchangeable before anyone is placed on them. The search still covers every distinct partition.

A finished assignment is turned into the canonical teams described above. The search keeps the assignment with the smaller spread, then the lexicographically smaller team list.

While every rating is a safe integer and `teamSize` times the largest absolute rating is also a safe integer, a partial assignment can be discarded. Discard it when a complete candidate with a finite spread already exists and the partial seat totals already imply a larger spread: either two full seats differ by more than that spread, or a seat total is already non-finite. Outside that integer range the search does not use that bound. Leaf totals are always the sorted-id sums.

If no assignment fills the teams, the function throws `parties cannot be placed into the teams`. If every finished assignment has a non-finite team total, it throws `team total must be finite`. If the totals are finite and the spread is not, it throws `spread must be finite`.

### Heuristic

The heuristic builds up to two starting assignments, improves each one, and keeps the better canonical result.

The snake draft sorts units by draft rating descending, then size descending, then member list ascending. Round `0` visits seats from `0` upward. Odd rounds visit seats from `teamCount - 1` downward. Each visit places the first remaining unit in that draft order whose size fits in the seat, or it skips the seat when none fits. One visit places one unit. A party therefore takes one turn and fills one player slot per member, all on that same seat. If a full round places no unit, the draft stops and is discarded.

On the six-player input in Usage, that draft puts `a`, `d`, and `e` on seat `0` (total `23`) and `b`, `c`, and `f` on seat `1` (total `22`). Later swaps and the second start are allowed to replace those seats. The returned teams are the ones in Usage.

The second start uses the same unit order. Each unit is placed on a seat that has room and the smallest running total. The running total adds unit draft ratings in placement order. Ties keep the lower seat index. For ratings that are not safe integers, that running total can differ from the sorted-id team total. It is used only to choose a seat. If this start produces the same seat array as the snake draft, it is not improved a second time.

If both starts leave a unit unplaced, a depth-first packer runs. It tries units in packing order and seats from the lowest index, with the same one-empty-seat rule. The first complete placement is the start. Sizes `2, 2, 2, 3, 3` into two teams of six are feasible only as the three pairs on one team and the two triples on the other. Both drafts miss that placement, and the packer finds it. If the packer also fails, the function throws `parties cannot be placed into the teams`.

Improvement then walks draft seats `i < j`. Inside a seat, units are in index order. It swaps two units of equal size when the swap lowers the spread, or when the spread stays the same and the canonical team list becomes lexicographically smaller. The first accepted swap restarts the walk.

When the unit count is `16` or less and no single swap improves the assignment, the search tries two disjoint swaps together. It walks unit indexes `i < j` and `k < l` so that all four indexes are distinct and `k > i`, increasing `i`, then `j`, then `k`, then `l`. The two swaps are applied together. The move is kept only when the spread becomes strictly smaller. A double swap is not kept for lexicographic order alone. After one is kept, single swaps start again. Above `16` units, only single swaps run.

The heuristic can return a larger spread than the exact search. It does not claim to try every partition. On a fixed input it returns one canonical result.

### What the function does not do

Each call is independent. The module has no mutable shared state. Returned team objects, member arrays, the team array, and the result object are frozen. A player id string is stored as given. The function does not copy a caller-supplied object other than the ids and ratings it reads.

The same input produces the same output. `splitTeams` does not read a clock, a timer, or a random source.

## License

MIT. Copyright (c) 2026 Vadim Gubin. See [LICENSE](LICENSE).
