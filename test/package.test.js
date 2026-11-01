import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  DEFAULT_EXACT_LIMIT,
  EXACT,
  HEURISTIC,
  MAX_EXACT_COMBINATIONS,
  METHODS
} from "../src/index.js";
import * as api from "../src/index.js";

const root = new URL("..", import.meta.url);

test("public exports stay limited to the documented surface", () => {
  assert.deepEqual(Object.keys(api).sort(), [
    "DEFAULT_EXACT_LIMIT",
    "EXACT",
    "HEURISTIC",
    "MAX_EXACT_COMBINATIONS",
    "METHODS",
    "splitTeams"
  ]);
  assert.equal(DEFAULT_EXACT_LIMIT, 12);
  assert.equal(MAX_EXACT_COMBINATIONS, 1048576);
  assert.equal(EXACT, "exact");
  assert.equal(HEURISTIC, "heuristic");
  assert.deepEqual(METHODS, ["exact", "heuristic"]);
  assert.equal(Object.isFrozen(METHODS), true);
});

test("package metadata names the module and the author", () => {
  const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
  assert.equal(pkg.name, "@aneron/team-split");
  assert.equal(pkg.license, "MIT");
  assert.equal(pkg.author, "Vadim Gubin");
  assert.equal(pkg.type, "module");
  assert.equal(pkg.sideEffects, false);
  assert.equal(pkg.engines.node, ">=20");
  assert.equal(pkg.private, undefined);
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.main, "./src/index.js");
  assert.equal(pkg.exports, "./src/index.js");
  assert.equal(pkg.repository.type, "git");
  assert.equal(pkg.repository.url, "git+https://github.com/ANERON-GAMES/team-split.git");
  assert.deepEqual(pkg.files, ["src", "LICENSE", "README.md"]);
  const license = readFileSync(new URL("LICENSE", root), "utf8");
  assert.equal(license.includes("Copyright (c) 2026 Vadim Gubin"), true);
  assert.equal(license.includes("anerongames"), false);
  const readme = readFileSync(new URL("README.md", root), "utf8");
  for (const heading of [
    "## Purpose",
    "## Install",
    "## Usage",
    "## API",
    "## Design",
    "## License"
  ]) {
    assert.equal(readme.includes(heading), true, heading);
  }
  assert.equal(readme.includes("## Design notes"), false);
  assert.equal(readme.includes("## API reference"), false);
  assert.equal(readme.includes('["a", "c", "f"]'), true);
  assert.equal(readme.includes('["b", "d", "e"]'), true);
  assert.equal(readme.includes("`result.spread` is `1`"), true);
  assert.equal(readme.includes('`result.method` is `"exact"`'), true);
  assert.equal(readme.includes('["a", "b", "d"]'), true);
  assert.equal(readme.includes('["c", "e", "f"]'), true);
  assert.equal(readme.includes("`grouped.spread` is `1`"), true);
  assert.equal(readme.includes('["a", "f"]'), true);
  assert.equal(readme.includes("`trio.spread` is `1`"), true);
  assert.equal(readme.includes('`heuristic.method` is `"heuristic"`'), true);
  assert.equal(readme.includes("`heuristic.spread` is `1`"), true);
  assert.equal(readme.includes("1048576"), true);
  assert.equal(readme.includes("snake draft"), true);
  const ci = readFileSync(new URL(".github/workflows/ci.yml", root), "utf8");
  assert.equal(ci.includes("node-version: [20, 22]"), true);
  assert.equal(ci.includes("npm ci"), true);
  assert.equal(ci.includes("npm test"), true);
  assert.equal(ci.includes("npm run lint"), true);
  assert.equal(ci.includes("npm run format:check"), true);
});

test("source files do not contain comments, clocks, timers, or network calls", () => {
  const files = readdirSync(new URL("src/", root)).sort();
  assert.deepEqual(files, [
    "constants.js",
    "exact.js",
    "heuristic.js",
    "index.js",
    "order.js",
    "pack.js",
    "result.js",
    "split.js",
    "units.js",
    "validate.js"
  ]);
  for (const name of files) {
    const source = readFileSync(new URL("src/" + name, root), "utf8");
    const specifiers = source.match(/from "[^"]+"/g) ?? [];
    assert.equal(specifiers.length > 0 || !source.includes("import "), true, name);
    for (const specifier of specifiers) {
      assert.match(specifier, /^from "\.\/[a-z]+\.js"$/);
    }
    assert.equal(source.includes("node:"), false, name);
    assert.equal(source.includes("require("), false, name);
    assert.equal(source.includes("/*"), false, name);
    assert.equal(source.includes("//"), false, name);
    for (const token of [
      "Date",
      "setTimeout",
      "setInterval",
      "Math.random",
      "process",
      "fetch(",
      "globalThis",
      "queueMicrotask",
      "setImmediate",
      "performance"
    ]) {
      assert.equal(source.includes(token), false, name + " " + token);
    }
  }
});

test("the lockfile resolves only from the npm registry", () => {
  const lockPath = new URL("package-lock.json", root);
  const lock = JSON.parse(readFileSync(lockPath, "utf8"));
  assert.equal(lock.lockfileVersion >= 2, true);
  const text = readFileSync(lockPath, "utf8");
  assert.equal(text.includes("git+"), false);
  assert.equal(text.includes("github:"), false);
  assert.equal(text.includes("registry.yarnpkg.com"), false);
  let resolved = 0;
  const walk = (value) => {
    if (Array.isArray(value)) {
      for (const item of value) {
        walk(item);
      }
      return;
    }
    if (value !== null && typeof value === "object") {
      if (typeof value.resolved === "string") {
        resolved += 1;
        assert.equal(
          value.resolved.startsWith("https://registry.npmjs.org/"),
          true,
          value.resolved
        );
      }
      for (const key of Object.keys(value)) {
        walk(value[key]);
      }
    }
  };
  walk(lock);
  assert.equal(resolved > 0, true);
});
