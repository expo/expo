import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { it } from 'node:test';
import { isDeepStrictEqual } from 'node:util';

import { assertCheckedInManifestKeys } from './CheckedInManifest';

type DumpedObject = Record<string, unknown>;
type Dump = DumpedObject & {
  products: DumpedObject[];
  targets: DumpedObject[];
  dependencies: { sourceControl: DumpedObject[] }[];
};

// src/ and build/ sit at the same depth, so this resolves from either.
const FIXTURE_DUMP = path.resolve(
  __dirname,
  '../../../packages/expo/scripts/spm/__tests__/fixtures/target-paths/explicit-path/dump.json'
);
const REMOTE_URL = 'https://example.com/remote.git';

function readFixtureDump(): Dump {
  return JSON.parse(fs.readFileSync(FIXTURE_DUMP, 'utf8'));
}

/** The fixture plus one remote dependency, in the shape Swift 6.4 dumps `.package(url:exact:)`. */
function dump(): Dump {
  const manifest = readFixtureDump();
  manifest.dependencies = [
    {
      sourceControl: [
        {
          identity: 'remote',
          location: { remote: [{ urlString: REMOTE_URL }] },
          productFilter: null,
          requirement: { exact: ['1.2.3'] },
          traits: [{ name: 'default' }],
        },
      ],
    },
  ];
  return manifest;
}

const OBJECTS = {
  package: { label: 'package "fixture"', select: (manifest: Dump) => manifest },
  product: { label: 'product "ExpoHaptics"', select: (manifest: Dump) => manifest.products[0] },
  target: { label: 'target "ExpoHaptics"', select: (manifest: Dump) => manifest.targets[0] },
  'package dependency': {
    label: `package dependency "${REMOTE_URL}"`,
    select: (manifest: Dump) => manifest.dependencies[0].sourceControl[0],
  },
};
type ObjectKind = keyof typeof OBJECTS;

/** Assigns an own enumerable key, even one such as `__proto__` that plain assignment would not. */
function setKey(object: DumpedObject, key: string, value: unknown) {
  Object.defineProperty(object, key, {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  });
}

function check(manifest: Dump, reached = ['ExpoHaptics']) {
  assertCheckedInManifestKeys(manifest, 'ExpoHaptics', new Set(reached));
}

const PREFIX =
  'Cannot use the checked-in Package.swift for product "ExpoHaptics", target "ExpoHaptics": ';
// The same closing next step CheckedInManifest.test.ts requires of every diagnostic.
const NEXT_STEP =
  /\. (Add|Check|Declare|Exclude|Fix|Keep|Move|Provide|Remove|Set|Split|Update|Use)\b[^\n]+[.]$/;

function rejects(manifest: Dump, detail: RegExp) {
  assert.throws(
    () => check(manifest),
    (error: Error) => {
      assert.ok(error.message.startsWith(PREFIX), error.message);
      assert.match(error.message, detail);
      assert.match(error.message, NEXT_STEP);
      return true;
    }
  );
}

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

it('dumped keys: accepts the unmodified fixture dump', () => {
  check(readFixtureDump());
});

it('dumped keys: accepts a remote dependency as Swift dumps it', () => {
  check(dump());
});

for (const requirement of [{ branch: ['main'] }, { revision: ['abc'] }]) {
  it(`dumped keys: accepts a ${Object.keys(requirement)[0]} requirement`, () => {
    const manifest = dump();
    manifest.dependencies[0].sourceControl[0].requirement = requirement;
    check(manifest);
  });
}

type DefaultCase = {
  object: ObjectKind;
  key: string;
  fallback: unknown;
  nonDefault: unknown;
  /** Replaced checks keep their old hint; every other key is named in the message. */
  hint?: RegExp;
};

const DEFAULTS: DefaultCase[] = [
  {
    object: 'package',
    key: 'defaultLocalization',
    fallback: null,
    nonDefault: 'en',
    hint: /Remove the localization, or remove Package\.swift to build this product from spm\.config\.json instead\.$/,
  },
  { object: 'package', key: 'swiftLanguageVersions', fallback: null, nonDefault: ['5'] },
  { object: 'package', key: 'cLanguageStandard', fallback: null, nonDefault: 'c11' },
  { object: 'package', key: 'cxxLanguageStandard', fallback: null, nonDefault: 'c++17' },
  { object: 'package', key: 'pkgConfig', fallback: null, nonDefault: 'zlib' },
  { object: 'package', key: 'providers', fallback: null, nonDefault: [{ brew: [['zlib']] }] },
  {
    object: 'package',
    key: 'traits',
    fallback: [],
    nonDefault: [{ enabledTraits: [], name: 'Fast' }],
  },
  { object: 'product', key: 'settings', fallback: [], nonDefault: [{ tool: 'swift' }] },
  {
    object: 'target',
    key: 'pluginUsages',
    fallback: [],
    nonDefault: [{ plugin: ['Generate', null] }],
    hint: /Remove the plugin application or move its implementation into a regular target\.$/,
  },
  {
    object: 'target',
    key: 'settings',
    fallback: [],
    nonDefault: [{ kind: { define: { _0: 'B' } }, tool: 'swift' }],
  },
  { object: 'target', key: 'packageAccess', fallback: true, nonDefault: false },
  { object: 'package dependency', key: 'productFilter', fallback: null, nonDefault: ['Remote'] },
];

const PROBES: unknown[] = ['', 0, 1, false, true, 'true', null, {}, [], [null]];

for (const { object, key, fallback, nonDefault, hint } of DEFAULTS) {
  const { label, select } = OBJECTS[object];
  const detail = (value: unknown) =>
    hint ?? new RegExp(`: ${escape(label)} declares ${key} ${escape(JSON.stringify(value))}, `);

  it(`dumped keys: accepts ${object} ${key} when absent`, () => {
    const manifest = dump();
    delete select(manifest)[key];
    check(manifest);
  });

  it(`dumped keys: accepts ${object} ${key} at its default ${JSON.stringify(fallback)}`, () => {
    const manifest = dump();
    setKey(select(manifest), key, structuredClone(fallback));
    check(manifest);
  });

  const nonDefaults = [nonDefault, ...PROBES].filter(
    (probe) => !isDeepStrictEqual(probe, fallback)
  );
  for (const value of nonDefaults) {
    it(`dumped keys: rejects ${object} ${key} ${JSON.stringify(value)}`, () => {
      const manifest = dump();
      setKey(select(manifest), key, value);
      rejects(manifest, detail(value));
    });
  }
}

for (const [object, { label, select }] of Object.entries(OBJECTS)) {
  for (const key of ['futureKey', 'constructor', 'toString', '__proto__']) {
    it(`dumped keys: rejects unknown ${object} key ${key}`, () => {
      const manifest = dump();
      setKey(select(manifest), key, []);
      rejects(
        manifest,
        new RegExp(
          `: ${escape(label)} declares key "${escape(key)}", which this version of et prebuild does not know.* Add "${escape(key)}" to the ${object} keys in .*CheckedInManifest\\.ts `
        )
      );
    });
  }
}

it('dumped keys: rejects a local package dependency with its old hint', () => {
  const manifest = dump();
  manifest.dependencies = [
    {
      fileSystem: [{ identity: 'local', path: '/abs/local', productFilter: null, traits: [] }],
    } as unknown as Dump['dependencies'][number],
  ];
  rejects(
    manifest,
    /: the manifest declares local package dependency "\/abs\/local", .* Remove the \.package\(path:\) declaration/
  );
});

it('dumped keys: rejects a registry package dependency with its old hint', () => {
  const manifest = dump();
  manifest.dependencies = [
    {
      registry: [
        {
          identity: 'example.remote',
          productFilter: null,
          requirement: { exact: ['1.2.3'] },
          traits: [],
        },
      ],
    } as unknown as Dump['dependencies'][number],
  ];
  rejects(
    manifest,
    /: the manifest declares registry package dependency "example\.remote", .* Use \.package\(url:exact:\)/
  );
});

it('dumped keys: rejects a version range with its old hint', () => {
  const manifest = dump();
  manifest.dependencies[0].sourceControl[0].requirement = {
    range: [{ lowerBound: '1.0.0', upperBound: '2.0.0' }],
  };
  rejects(
    manifest,
    new RegExp(
      `: the manifest declares ${escape(REMOTE_URL)} with a version range, .* Use exact: in Package\\.swift`
    )
  );
});

it('dumped keys: checks only the targets the product reaches', () => {
  const manifest = dump();
  manifest.targets.push({ ...manifest.targets[0], name: 'Unreached', settings: [{ tool: 'c' }] });
  check(manifest);
  assert.throws(
    () => check(manifest, ['ExpoHaptics', 'Unreached']),
    /target "Unreached" declares settings /
  );
});

it('dumped keys: checks only the library product being built', () => {
  const manifest = dump();
  manifest.products.push({ ...manifest.products[0], name: 'Other', settings: [{ tool: 'c' }] });
  check(manifest);
});
