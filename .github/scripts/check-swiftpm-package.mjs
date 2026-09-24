import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Check the shipped package, not just files that happen to exist in the checkout.
const repository = fileURLToPath(new URL("../../", import.meta.url));
const [name, option] = process.argv.slice(2);
assert(
  ["expo", "expo-modules-jsi"].includes(name),
  "Expected expo or expo-modules-jsi",
);
assert(!option || option === "--config-only", "Unknown option");
const root = path.join(repository, "packages", name);
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);

if (name === "expo-modules-jsi") {
  const config = JSON.parse(
    fs.readFileSync(path.join(root, "spm.config.json"), "utf8"),
  );
  assert.equal(
    config.publishPrebuilds,
    true,
    "ExpoModulesJSI must opt into prebuilt publishing",
  );
  assert(
    manifest.scripts?.["precompile-ios"],
    "ExpoModulesJSI needs a publishing build task",
  );
  assert(
    manifest.scripts?.prepack,
    "ExpoModulesJSI needs a prepack hook to stage its artifacts",
  );
}

if (option === "--config-only") {
  console.log(`${name}: publishing configuration verified`);
  process.exit(0);
}

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "expo-spm-package-"));
function run(command, args, cwd = root) {
  try {
    return execFileSync(command, args, {
      cwd,
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
      // The lifecycle hook is part of this check, even if the install skipped scripts.
      env: { ...process.env, npm_config_ignore_scripts: "false" },
    });
  } catch (error) {
    throw new Error(
      `${command} ${args.join(" ")} failed:\n${error.stdout}\n${error.stderr}`,
    );
  }
}

try {
  if (name === "expo-modules-jsi") {
    // A previous pack must not hide a broken staging hook.
    fs.rmSync(path.join(root, "prebuilds"), { recursive: true, force: true });
  }
  run("pnpm", ["pack", "--pack-destination", temporary]);
  const archives = fs
    .readdirSync(temporary)
    .filter((file) => file.endsWith(".tgz"));
  assert.equal(archives.length, 1, "Expected one npm tarball");
  const archive = path.join(temporary, archives[0]);
  const entries = run("tar", ["-tzf", archive]).trim().split("\n");

  if (name === "expo") {
    assert(
      entries.includes("package/Package.swift"),
      "Published expo is missing Package.swift",
    );
    assert.equal(
      run("tar", ["-xOf", archive, "package/Package.swift"]),
      fs.readFileSync(path.join(root, "Package.swift"), "utf8"),
      "The published SwiftPM manifest must match the source",
    );
  } else {
    for (const flavor of ["debug", "release"]) {
      const artifact = `package/prebuilds/output/${flavor}/xcframeworks/ExpoModulesJSI.tar.gz`;
      assert(
        entries.includes(artifact),
        `Published ExpoModulesJSI is missing ${flavor} artifacts`,
      );
      run("tar", ["-xzf", archive, "-C", temporary, artifact]);
      const framework = run("tar", ["-tzf", path.join(temporary, artifact)])
        .trim()
        .split("\n");
      assert(
        framework.includes("ExpoModulesJSI.xcframework/Info.plist"),
        `${flavor} tarball does not contain ExpoModulesJSI.xcframework`,
      );
    }
    assert(
      !entries.some((entry) => entry.includes("/.expo-prebuild/")),
      "Raw build output leaked",
    );
  }
  console.log(`${name}: published SwiftPM package contents verified`);
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
