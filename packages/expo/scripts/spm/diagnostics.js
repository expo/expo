/**
 * Actionable diagnostics for modules the plugin cannot contribute to the SwiftPM
 * graph. A module that is dropped silently does not fail the build — it fails at
 * runtime with `Cannot find native module '<Name>'`, far from the cause. So every
 * uncovered module is reported as an `error:` line (Xcode parses that prefix into
 * a build error) and the sync fails.
 *
 * The remedy for a mixed Swift/ObjC module is the same one React Native's
 * autolinker prescribes for community libraries: the module ships a Package.swift
 * declaring its own target split. Locally that means patch-package; permanently it
 * means a PR to the module.
 *
 * Rendering is PURE (entries → string) so the exact wording is unit-testable.
 */

'use strict';

const fs = require('fs');

/**
 * Pod-name families already covered by the SwiftPM graph: Expo's own modules
 * (contributed by this plugin) and React Native's products (contributed by RN).
 * A dependency outside these is a CocoaPods-only dependency with no SwiftPM
 * counterpart.
 */
const COVERED_POD_PREFIXES = [
  'Expo',
  'EX',
  'UM',
  'EASClient',
  'expo-',
  'React',
  'RCT',
  'ReactCommon',
  'Yoga',
  'hermes',
  'glog',
  'boost',
  'DoubleConversion',
  'fmt',
  'folly',
  'RNReanimated',
  'RNWorklets',
];

/**
 * Pods that need no SwiftPM package because they resolve another way — a system
 * library reachable via `linkedLibrary`, for instance.
 */
const UNMAPPED_POD_ALLOWLIST = new Set(['sqlite3']);

/**
 * An error the plugin fails the sync with, namespaced so the failure is
 * attributable to it: what failed, then why and what to do next when known.
 * `options` goes to the Error, so a `cause` passed there is kept.
 */
function pluginError({ what, why, how }, options) {
  return new Error(`[expo-spm-plugin] ${[what, why, how].filter(Boolean).join(' ')}`, options);
}

class UnsupportedModulesError extends Error {
  constructor(entries) {
    const count = entries.reduce((n, e) => n + REFUSALS.get(e.reason).count(e), 0);
    super(
      `${count} Expo native ${count === 1 ? 'module' : 'modules'} cannot be built with ` +
        'Swift Package Manager. See the errors above for the fix for each one.'
    );
    this.name = 'UnsupportedModulesError';
    this.unsupported = entries;
  }
}

/**
 * Why each uncovered pod is uncovered: the most specific of the refusals it
 * collected. A missing interface tree is a single project-level fault that would
 * otherwise be reported once per module, so it collapses into one entry naming
 * the modules it took down.
 *
 * @param pending `{ podName, packageName, moduleRoot, refusals }` per uncovered pod,
 *   each refusal a `{ reason, ...facts }` whose reason `REFUSALS` registers.
 */
function classifyUnsupported({ pending, coreAvailable }) {
  if (!pending.length) return [];
  if (!coreAvailable) {
    return [{ reason: 'core-unavailable', pods: pending.map((p) => p.podName) }];
  }
  return pending.map(({ refusals, ...subject }) => ({ ...subject, ...mostSpecific(refusals) }));
}

function mostSpecific(refusals) {
  const priority = (refusal) => REFUSALS.get(refusal.reason).priority;
  return refusals.reduce((best, refusal) => (priority(refusal) < priority(best) ? refusal : best));
}

/**
 * The subset of pod dependencies with no SwiftPM counterpart. `satisfied` holds
 * the SwiftPM packages already declared as frameworks, matched on the root of the
 * pod name so that a subspec (`libavif/libdav1d`) is covered by its package —
 * the match CocoaPods makes in `precompiled_modules.rb#strip_matching_dependencies`.
 */
function unmappedPodDependencies(deps, satisfied = new Set()) {
  return deps.filter(
    (dep) =>
      !UNMAPPED_POD_ALLOWLIST.has(dep) &&
      !satisfied.has(dep.split('/')[0]) &&
      !COVERED_POD_PREFIXES.some((prefix) => dep.startsWith(prefix))
  );
}

/**
 * Two paths that name different real directories. A path that cannot be resolved
 * — a broken symlink, an unreadable parent — counts as no difference: a symlinked
 * layout is the normal case here, and a diagnostic is never worth failing on.
 */
function resolveToDifferentDirectories(left, right) {
  try {
    return fs.realpathSync(left) !== fs.realpathSync(right);
  } catch {
    return false;
  }
}

/**
 * Packages whose documented and autolinked roots are different REAL directories (a
 * symlinked path is not a conflict); any pod may document the second copy.
 * The plugin builds the copy the app's JavaScript does not import.
 */
function collectRootConflicts(identities) {
  const conflicts = new Map();
  for (const { packageName, documentedRoot, autolinkedRoot } of identities.values()) {
    if (conflicts.has(packageName) || documentedRoot == null || autolinkedRoot == null) continue;
    if (resolveToDifferentDirectories(documentedRoot, autolinkedRoot)) {
      conflicts.set(packageName, { packageName, moduleRoot: documentedRoot, autolinkedRoot });
    }
  }
  return [...conflicts.values()];
}

/**
 * A `duplicate-pod-name` entry for every pod name that separate copies declare:
 * different packages in different directories. SwiftPM, like CocoaPods, links a
 * pod name once, so which copy the app got would depend on the order the plugin
 * reached them in. Listings that share a package or a real directory are one copy,
 * and so is everything joined to them that way, whatever order they come in; each
 * copy is shown by its lowest root, and the copies are listed in that order. A root
 * that cannot be resolved is its own directory: two missing roots are not shown to be
 * one.
 *
 * @param identities every pod's identity, from `plugin.js#resolvePodIdentities`.
 */
function collectDuplicatePods(identities) {
  const copiesByPod = new Map();
  for (const { podName, packageName, declaringRoot } of identities.values()) {
    const listing = { packageName, moduleRoot: declaringRoot };
    const keys = [`package:${packageName}`, `directory:${realPathOrSelf(declaringRoot)}`];
    const copies = copiesByPod.get(podName) ?? [];
    const joined = copies.filter((copy) => keys.some((key) => copy.keys.has(key)));
    if (!joined.length) {
      copiesByPod.set(podName, [...copies, { listings: [listing], keys: new Set(keys) }]);
      continue;
    }
    // This listing can bridge copies that looked separate until now; they merge
    // into the earliest one.
    const [copy, ...merged] = joined;
    for (const key of keys) copy.keys.add(key);
    copy.listings.push(listing);
    for (const other of merged) {
      for (const key of other.keys) copy.keys.add(key);
      copy.listings.push(...other.listings);
    }
    copiesByPod.set(
      podName,
      copies.filter((other) => !merged.includes(other))
    );
  }
  return [...copiesByPod]
    .filter(([, copies]) => copies.length > 1)
    .map(([podName, copies]) => ({
      reason: 'duplicate-pod-name',
      podName,
      copies: copies.map(({ listings }) => lowestListing(listings)).sort(byListingOrder),
    }));
}

const listingOrder = ({ moduleRoot, packageName }) => `${moduleRoot}\0${packageName}`;
const byListingOrder = (a, b) =>
  listingOrder(a) < listingOrder(b) ? -1 : listingOrder(a) > listingOrder(b) ? 1 : 0;
const lowestListing = (listings) =>
  listings.reduce((lowest, listing) => (byListingOrder(listing, lowest) < 0 ? listing : lowest));

function realPathOrSelf(dir) {
  try {
    return fs.realpathSync(dir);
  } catch {
    return dir;
  }
}

const excludeSnippet = (...packageNames) =>
  `"expo": { "autolinking": { "exclude": ["${packageNames.join('", "')}"] } }`;

/** Next steps that several diagnostics end on, worded once. */
const remedy = {
  patchPackage: (packageName, file = 'that file') =>
    `If you do not own ${packageName}, persist ${file} with \`npx patch-package ${packageName}\` and commit the patch — node_modules is not committed, so without it this error returns on every fresh install and in CI.`,
  exclude: (packageName) =>
    `To build without this module for now, exclude it in your app's package.json: ${excludeSnippet(packageName)} — its native module will then be unavailable at runtime.`,
};

/** One diagnostic: its header line, the lines indented under it, and the module it is about. */
function renderBlock(header, lines, moduleRoot) {
  return [header, ...lines.map((line) => `  ${line}`), `  Module path: ${moduleRoot}`].join('\n');
}

function renderMixedNoManifest({ podName, packageName, moduleRoot }) {
  return renderBlock(
    `error: Expo module "${packageName}" (pod ${podName}) mixes Swift and Objective-C/C++ sources but ships neither a Package.swift nor an spm.config.json, so it cannot be built with Swift Package Manager.`,
    [
      `Swift Package Manager compiles Swift and Objective-C in separate targets, and only the module can declare where its split goes. Either route makes it consumable:`,
      `1. Add an spm.config.json to ${packageName} so the Expo prebuild pipeline can build it into an XCFramework — it compiles mixed-language targets, so no source split is needed. packages/expo-sensors is a worked example.`,
      `2. Or add a Package.swift to ${packageName} that splits its sources into a Swift target and an Objective-C target. packages/expo-constants is a worked example, splitting into EXConstants and EXConstantsObjC.`,
      `3. ${remedy.patchPackage(packageName, 'either manifest')}`,
      `4. Ask ${packageName}'s maintainer to ship it upstream, or open a PR adding it, so every consumer gets Swift Package Manager support.`,
      `5. ${remedy.exclude(packageName)}`,
    ],
    moduleRoot
  );
}

/**
 * The module declares a prebuildable product, so the artifact is simply not built
 * yet. Nothing about the module needs to change — this is a one-command fix, and
 * both flavors are mandatory because the plugin declares immutable pairs.
 */
function renderPrebuildAvailable({ podName, packageName, moduleRoot, productName }) {
  return renderBlock(
    `error: Expo module "${packageName}" (pod ${podName}) has no prebuilt XCFramework, so it is not in the Swift Package Manager graph.`,
    [
      `It declares "${productName}" in its spm.config.json, so it does not need a Package.swift — the Expo prebuild pipeline builds it. The artifact is just missing.`,
      `Build it — omit --flavor so both Debug and Release are built, since the plugin declares an immutable pair and rejects a half-built one:`,
      `    et prebuild ${packageName}`,
      `Then re-run \`npx react-native spm update\`. A published ${packageName} that ships prebuilds/output/<flavor>/xcframeworks is picked up with no local build.`,
    ],
    moduleRoot
  );
}

function renderNoAppleSources({ podName, packageName, moduleRoot }) {
  return renderBlock(
    `error: Expo module "${packageName}" (pod ${podName}) has no \`ios\` or \`apple\` source directory, so Swift Package Manager has nothing to compile.`,
    [
      `Its podspec points at sources the plugin cannot locate — either the package is incomplete (a partial install) or it keeps its Apple sources somewhere non-standard and needs a checked-in Package.swift naming their real path.`,
      `Reinstall the package first. If the layout is intentional, add a Package.swift to ${packageName} and persist it with \`npx patch-package ${packageName}\`, then upstream it.`,
    ],
    moduleRoot
  );
}

function renderUnresolvableTargetPath({ podName, packageName, moduleRoot, targetNames }) {
  const quoted = targetNames.map((n) => `"${n}"`).join(', ');
  const plural = targetNames.length === 1 ? 'target' : 'targets';
  return renderBlock(
    `error: Expo module "${packageName}" (pod ${podName}) ships a Package.swift whose ${plural} ${quoted} declare no \`path:\` and have no sources on disk, so it was skipped.`,
    [
      `A target without \`path:\` takes its sources from Sources/<target name> (or Source/, src/, srcs/). None of those directories exist in the module, so the generated package would point at nothing — usually a partial install, or a manifest naming targets whose sources live elsewhere.`,
      `Reinstall ${packageName} first. If its layout is intentional, add an explicit \`path:\` to each target in its Package.swift, persist it with \`npx patch-package ${packageName}\`, and upstream it.`,
    ],
    moduleRoot
  );
}

function renderNotExportedByManifest({
  podName,
  packageName,
  moduleRoot,
  productName,
  exportedProducts,
}) {
  return renderBlock(
    `error: Expo module "${packageName}" (pod ${podName}) is built from the Package.swift at its module root, but that manifest does not export "${productName}", so the pod cannot be linked.`,
    [
      `The manifest exports ${exportedProducts.map((name) => `"${name}"`).join(', ') || 'no library products'}. A pod is linked through the library product of the same name.`,
      `Add a \`.library(name: "${productName}", …)\` product to that Package.swift, or remove the pod from ${packageName}. ${remedy.patchPackage(packageName)}`,
      remedy.exclude(packageName),
    ],
    moduleRoot
  );
}

// Map, not an object: the kind comes from a dumped manifest, and an inherited key like
// "constructor" would otherwise resolve to a function.
const TARGET_KIND_PHRASES = new Map([
  ['binary', 'a binary target'],
  ['macro', 'a macro target'],
  ['plugin', 'a plugin target'],
  ['system', 'a system library target'],
  ['systemLibrary', 'a system library target'],
  ['test', 'a test target'],
  ['executable', 'an executable target'],
]);

const targetKindPhrase = (kind) => TARGET_KIND_PHRASES.get(kind) ?? 'not a source target';

/**
 * The module's manifest wires a source target to a target the generated package
 * cannot re-declare. Emitting the target without that dependency would compile and
 * fail at link time instead, with nothing naming the manifest that caused it.
 */
function renderUnsupportedTargetDependency({ podName, packageName, moduleRoot, dependencies }) {
  const wiring =
    dependencies.length === 1
      ? 'whose source target depends on a target'
      : 'whose source targets depend on targets';
  return renderBlock(
    `error: Expo module "${packageName}" (pod ${podName}) ships a Package.swift ${wiring} the generated package cannot declare, so it was skipped.`,
    [
      ...dependencies.map(
        ({ target, dependsOn, kind }) =>
          `    target "${target}" depends on "${dependsOn}", ${targetKindPhrase(kind)}`
      ),
      `The generated package mirrors only the module's regular source targets. A target of any other kind is built by Swift Package Manager from the module's own manifest, so the generated package has nothing to depend on. Emitting the target without that dependency would compile and then fail at link time with undefined symbols, far from the manifest that declared it.`,
      `Add an spm.config.json to ${packageName} so the Expo prebuild pipeline builds the whole module into an XCFramework instead — it compiles the package as checked in, these targets included. packages/expo-sensors is a worked example.`,
      remedy.patchPackage(packageName),
    ],
    moduleRoot
  );
}

/** What a fault is about, when it is a package the manifest declares. */
function packageSubject(identity, target) {
  const named = identity != null ? `package "${identity}"` : 'an unnamed package';
  return target != null ? `${named}, used by target "${target}",` : named;
}

/** What a fault is about, when it is one target's dependency rather than a package. */
const dependencySubject = (identity, target) =>
  `the dependency on "${identity}" in target "${target}"`;

const conditionStep = (packageName) =>
  `Condition it on platforms alone in ${packageName}'s Package.swift. Rendering it without the rest would apply the dependency more widely than the module declared.`;

const byUrlStep = (packageName) =>
  `Declare it by remote URL in ${packageName}'s Package.swift instead.`;

// One fault, one cause and one next step: the causes have nothing in common but the
// module they skip.
const PACKAGE_DEPENDENCY_FAULTS = {
  'local-path': {
    fault: 'is declared at a local path, which this plugin does not resolve',
    step: (packageName) =>
      `Declare it by remote URL in ${packageName}'s Package.swift — the generated package is written into the app's build directory, and a path declared relative to the module does not reach from there.`,
  },
  registry: {
    fault: 'is declared through a package registry, which this plugin does not declare',
    step: byUrlStep,
  },
  'unsupported-location': {
    fault: 'is declared from a source-control location that is not a remote URL',
    step: byUrlStep,
  },
  'unsupported-requirement': {
    fault: 'names a version requirement this plugin cannot render',
    step: () =>
      'Pin it to an exact version, a branch, a revision or a version range, which are the requirements the generated package can declare.',
  },
  'unknown-form': {
    fault: 'is declared in a form this plugin does not recognize',
    step: (packageName) =>
      `Declare it by remote URL in ${packageName}'s Package.swift. A newer Swift Package Manager form needs support added in expo/scripts/spm/manifests.js.`,
  },
  'undeclared-package': {
    fault: 'is not declared by the manifest, so the product that names it resolves to nothing',
    step: (packageName) =>
      `Declare that package in ${packageName}'s Package.swift, or correct the package name on the dependency — Swift Package Manager matches it against the package's identity, which is the repository name.`,
  },
  'collides-with-injected': {
    fault:
      'has the same identity as a package React Native already contributes, and Swift Package Manager resolves one identity to one package',
    step: () =>
      "Depend on the product React Native's package already provides and remove the declaration, or declare a package whose repository name differs from React Native's.",
  },
  'module-aliases': {
    fault: 'is renamed with moduleAliases, which this plugin does not render',
    step: (packageName) =>
      `Drop the alias in ${packageName}'s Package.swift and import the module under its own name. An alias that resolves a duplicate module name has no equivalent here.`,
  },
  'unsupported-condition': {
    fault: 'is conditioned on more than platforms, and this plugin renders only platforms',
    step: conditionStep,
  },
  'unsupported-target-condition': {
    subject: dependencySubject,
    fault: 'is conditioned on more than platforms, and this plugin renders only platforms',
    step: conditionStep,
  },
  'ambiguous-package-name': {
    subject: (identity) => `"${identity}"`,
    fault:
      'is claimed by two of the packages the manifest declares, so a dependency naming it has no single answer',
    step: (packageName) =>
      `Give them distinct names in ${packageName}'s Package.swift. A package answers to its identity — the repository name — and to the name a deprecated \`.package(name:url:)\` gives it.`,
  },
  'unsupported-traits': {
    fault: 'is declared with a trait set other than the default, which this plugin does not render',
    step: (packageName) =>
      `Declare it with its default traits in ${packageName}'s Package.swift. Traits select which of a package's code builds, so the generated package would build something else.`,
  },
};

const UNKNOWN_PACKAGE_FAULT = {
  fault: 'cannot be declared by the generated package',
  step: (packageName) => `Declare it as a remote package in ${packageName}'s Package.swift.`,
};

function renderPackageDependencyLines({ form, identity, target }, packageName) {
  const {
    subject = packageSubject,
    fault,
    step,
  } = Object.hasOwn(PACKAGE_DEPENDENCY_FAULTS, form)
    ? PACKAGE_DEPENDENCY_FAULTS[form]
    : UNKNOWN_PACKAGE_FAULT;
  return [`    ${subject(identity, target)} ${fault}.`, `      ${step(packageName)}`];
}

/**
 * The module's manifest declares a Swift package the generated package cannot mirror.
 * Emitting the module without it would compile until its first import of that package,
 * with nothing naming the manifest that declared it.
 */
function renderUnsupportedPackageDependency({ podName, packageName, moduleRoot, dependencies }) {
  return renderBlock(
    `error: Expo module "${packageName}" (pod ${podName}) ships a Package.swift the generated package cannot mirror, so it was skipped.`,
    [
      ...dependencies.flatMap((dependency) =>
        renderPackageDependencyLines(dependency, packageName)
      ),
      `The generated package re-declares what the module's own manifest declares, so its sources compile against the same packages under Swift Package Manager as under CocoaPods.`,
      `Adding an spm.config.json to ${packageName} is the other route: the Expo prebuild pipeline then builds the whole module into an XCFramework, resolving the module's packages as they are checked in. packages/expo-sensors is a worked example.`,
      remedy.patchPackage(packageName),
    ],
    moduleRoot
  );
}

function renderNeedsManifestForLinkage({ podName, packageName, moduleRoot, file, line, snippet }) {
  return renderBlock(
    `error: Expo module "${packageName}" (pod ${podName}) declares native linkage in its podspec, which the Swift Package Manager plugin does not read, so it was skipped.`,
    [
      `${file}:${line} declares it:`,
      `    ${snippet}`,
      `A podspec is Ruby: reading it without running it means guessing, and a guessed link line does not fail here — it fails in a shipped app with a missing symbol. Swift Package Manager needs the linkage stated exactly.`,
      `Add a Package.swift to ${packageName} declaring the module's target with \`linkerSettings: [.linkedFramework("Photos"), .linkedLibrary("sqlite3")]\` — the plugin mirrors those verbatim. Or add an spm.config.json, so the Expo prebuild pipeline builds the module into an XCFramework instead. packages/expo-constants shows the shape of a checked-in Package.swift, though it declares no linkage of its own; packages/expo-sensors is a worked spm.config.json.`,
      remedy.patchPackage(packageName),
    ],
    moduleRoot
  );
}

/**
 * Some of the module's pods resolved to prebuilt frameworks and the rest did not.
 * Both source routes build the module whole, so emitting it would link the
 * prebuilt pods twice — once as frameworks, once from source.
 */
function renderPartiallyPrecompiled({
  podName,
  packageName,
  moduleRoot,
  precompiledSiblings,
  precompiledProducts,
  artifactDirs,
  prebuildProduct,
}) {
  const siblings = precompiledSiblings.join(', ');
  const one = precompiledSiblings.length === 1;
  const artifacts = precompiledProducts
    .map((product) => `${product}.xcframework or ${product}.tar.gz`)
    .join(', ');
  const sourceOnly = prebuildProduct?.sourceOnly === true;
  const productStep =
    prebuildProduct == null
      ? `add a product for ${podName} to ${packageName}'s spm.config.json, then build it`
      : `build ${podName} too — ${packageName}'s spm.config.json already declares "${prebuildProduct.name}"`;
  const precompile = [
    `To precompile all of them, ${productStep}. Omit --flavor so both Debug and Release are built, since the plugin declares an immutable pair and rejects a half-built one:`,
    `    et prebuild ${packageName}`,
    `   Then re-run \`npx react-native spm update\`.`,
  ];
  const remedies = [
    ...(sourceOnly ? [] : [precompile]),
    [
      `To build it from source instead, delete the prebuilt ${siblings} artifacts — ${artifacts}, under debug/xcframeworks and release/xcframeworks — from each directory below, then re-run \`npx react-native spm update\`. The plugin searches them in this order and uses the first one that has an artifact, so one left behind anywhere is picked up again:`,
      ...artifactDirs.map((dir) => `    ${dir}`),
    ],
    [remedy.exclude(packageName)],
  ];
  return renderBlock(
    `error: Expo module "${packageName}" (pod ${podName}) has no prebuilt XCFramework, but its sibling ${one ? 'pod' : 'pods'} ${siblings} ${one ? 'does' : 'do'}, so the module cannot be built with Swift Package Manager.`,
    [
      `The plugin links ${siblings} as ${one ? 'a precompiled framework' : 'precompiled frameworks'}. It can build ${packageName} from source only as a whole module, every pod at once, so building ${podName} from source would link ${siblings} twice: once as ${one ? 'a framework' : 'frameworks'} and once from source.`,
      sourceOnly
        ? `${packageName}'s spm.config.json marks ${podName} as sourceOnly, so it never gets an XCFramework and the module cannot be precompiled as a whole:`
        : `A module must be precompiled for all of its pods or for none of them:`,
      ...remedies.flatMap(([first, ...rest], i) => [`${i + 1}. ${first}`, ...rest]),
    ],
    moduleRoot
  );
}

/**
 * Why CocoaPods links a companion for this app, and the app-side switch that stops it,
 * where one exists. The keys are read in `autolinkConditionMet`'s order.
 */
function companionCondition({ podName, npmPackage, podfileProperty, disabledValue } = {}) {
  if (podName != null) return { because: `the app has the ${podName} pod` };
  if (npmPackage != null) return { because: `the app depends on ${npmPackage}` };
  if (podfileProperty != null) {
    return disabledValue != null
      ? {
          because: `the Podfile property "${podfileProperty}" is not "${disabledValue}"`,
          turnOff: `set "${podfileProperty}" to "${disabledValue}" in ios/Podfile.properties.json`,
        }
      : {
          because: `the Podfile property "${podfileProperty}" is set`,
          turnOff: `remove "${podfileProperty}" from ios/Podfile.properties.json`,
        };
  }
  return { because: 'its autolinkWhen condition is met' };
}

/**
 * A gated pod is refused whether or not the condition is met: a link that never
 * consults the condition is only right by coincidence, and the coincidence changes
 * with the app's configuration. A companion (`linkedThrough`) is refused only where
 * its condition is met, because its module leaves it out.
 */
function renderUncheckedAutolinkCondition({
  podName,
  packageName,
  moduleRoot,
  productName,
  precompiled,
  linkedThrough,
  autolinkWhen,
}) {
  const linkedAs = precompiled
    ? 'as a precompiled XCFramework'
    : 'from source without a checked-in Package.swift';
  if (linkedThrough != null) {
    const { because, turnOff } = companionCondition(autolinkWhen);
    return renderBlock(
      `error: Expo module "${packageName}" links its pod ${linkedThrough} ${linkedAs}, so its product "${productName}" would be left out of the app.`,
      [
        `CocoaPods links "${productName}" because ${because}. Swift Package Manager cannot link "${productName}" yet, so the sync stops instead of building the app without it.`,
        ...(turnOff != null ? [`If the app does not need "${productName}", ${turnOff}.`] : []),
        `If the app needs "${productName}", report it at https://github.com/expo/expo/issues and include this error.`,
      ],
      moduleRoot
    );
  }
  return renderBlock(
    `error: Expo module "${packageName}" declares an autolinkWhen condition for its product "${productName}" (pod ${podName}), but the product would be linked ${linkedAs}.`,
    [
      `The Swift Package Manager plugin checks autolinkWhen only for packages that ship a checked-in Package.swift. Linking "${productName}" any other way would ignore its condition, so the sync stops instead.`,
      `Ship a checked-in Package.swift for ${packageName}, so the condition decides whether "${productName}" is linked. Or remove the ${podName} podspec from \`apple.podspecPath\` in ${packageName}'s expo-module.config.json, so the product is never linked this way. If "${productName}" should always be linked, drop its autolinkWhen from spm.config.json instead.`,
    ],
    moduleRoot
  );
}

function renderCoreUnavailable({ pods }) {
  return [
    `error: ExpoModulesCore has no prebuilt Debug and Release xcframework, so all ${pods.length} source-built Expo ${pods.length === 1 ? 'module' : 'modules'} were skipped.`,
    `  Every Expo source module compiles against the ExpoModulesCore framework interface tree; without both flavors the plugin cannot emit any of them.`,
    `  Build the precompiled core, once per flavor (the flavor name is case-sensitive):`,
    `      et prebuild -f Debug expo-modules-core expo-modules-jsi`,
    `      et prebuild -f Release expo-modules-core expo-modules-jsi`,
    `  Skipped: ${pods.join(', ')}`,
  ].join('\n');
}

function renderDuplicatePodName({ podName, copies }) {
  const others = copies.slice(1).map((copy) => copy.packageName);
  return [
    `error: The pod ${podName} is declared by ${copies.length} different packages, so none of them was linked:`,
    ...copies.map(({ packageName, moduleRoot }) => `      "${packageName}" at ${moduleRoot}`),
    `  Swift Package Manager, like CocoaPods, links a pod name only once, and these are separate copies of it — different packages in different directories — so which one the app got would depend on the order they were found in.`,
    `  Keep one of them: remove the others from your app, or exclude them in your app's package.json: ${excludeSnippet(...others)} — their native modules will then be unavailable at runtime.`,
  ].join('\n');
}

/**
 * Every reason the plugin refuses a pod, most specific first: a pod refused for
 * several is reported for the first of them. `count` is how many modules one
 * refusal stands for.
 */
const REFUSALS = new Map(
  [
    ['duplicate-pod-name', { render: renderDuplicatePodName }],
    ['partially-precompiled', { render: renderPartiallyPrecompiled }],
    ['prebuild-available', { render: renderPrebuildAvailable }],
    ['needs-manifest-for-linkage', { render: renderNeedsManifestForLinkage }],
    ['unsupported-target-dependency', { render: renderUnsupportedTargetDependency }],
    ['unsupported-package-dependency', { render: renderUnsupportedPackageDependency }],
    ['unresolvable-target-path', { render: renderUnresolvableTargetPath }],
    ['not-exported-by-manifest', { render: renderNotExportedByManifest }],
    ['no-apple-sources', { render: renderNoAppleSources }],
    ['mixed-no-manifest', { render: renderMixedNoManifest }],
    ['unchecked-autolink-condition', { render: renderUncheckedAutolinkCondition }],
    ['core-unavailable', { render: renderCoreUnavailable, count: ({ pods }) => pods.length }],
  ].map(([reason, refusal], priority) => [reason, { priority, count: () => 1, ...refusal }])
);

/** The full report: one `error:`-prefixed block per entry. Pure. */
function renderUnsupportedReport(entries) {
  return entries.map((entry) => REFUSALS.get(entry.reason).render(entry)).join('\n\n');
}

/**
 * Non-fatal counterpart: modules that DO get emitted but depend on pods with no
 * SwiftPM counterpart. They compile until they reach the missing dependency, so
 * this is a warning that explains the compile error before it happens.
 */
function renderUnmappedDependencyWarning(entries) {
  if (!entries.length) return '';
  return entries
    .map(({ packageName, podName, pods }) =>
      [
        `warning: Expo module "${packageName}" (pod ${podName}) depends on ${pods.length} CocoaPods ${pods.length === 1 ? 'dependency' : 'dependencies'} with no Swift Package Manager counterpart: ${pods.join(', ')}.`,
        `  The module is in the build graph, but any source that uses one of those will fail to compile.`,
        `  Each dependency needs a SwiftPM package (or an xcframework) the module can declare. Until then, exclude "${packageName}" in your app's package.json: ${excludeSnippet(packageName)}.`,
      ].join('\n')
    )
    .join('\n\n');
}

/**
 * Modules that ARE emitted but set linker flags in their podspec xcconfig. Swift
 * autolinks what its sources import, so these are usually redundant; when one is not,
 * the link error is what points here.
 */
function renderXcconfigLinkerWarning(entries) {
  if (!entries.length) return '';
  return entries
    .map(({ packageName, podName, file, line, snippet }) =>
      [
        `warning: Expo module "${packageName}" (pod ${podName}) sets linker flags in its podspec xcconfig, which the Swift Package Manager plugin does not read:`,
        `      ${file}:${line}: ${snippet}`,
        `  The module is built anyway — Swift links the system frameworks and the C++ runtime its sources import, so these flags are usually redundant outside CocoaPods.`,
        `  If it fails to link, declare what is missing in a Package.swift for the module — \`linkerSettings: [.linkedLibrary("c++"), .linkedFramework("Photos")]\` — which the plugin mirrors verbatim.`,
      ].join('\n')
    )
    .join('\n\n');
}

/** The sync does not fail, so this warning is the only place the mismatch shows. */
function renderRootConflictWarning(entries) {
  if (!entries.length) return '';
  return entries
    .map(({ packageName, moduleRoot, autolinkedRoot }) =>
      [
        `warning: Expo module "${packageName}" is installed twice, so its native code and your JavaScript can come from different copies of the package:`,
        `      built by this plugin: ${moduleRoot}`,
        `      imported by your app: ${autolinkedRoot}`,
        `  Both are real directories, not one directory reached through a symlink, so the copies can be different versions. The plugin builds the first one; your app's JavaScript imports the second. When the two disagree it usually surfaces at runtime, as a missing method or "Cannot find native module" — and two copies of different versions can fail the build instead.`,
        `  Run \`npm ls ${packageName}\` (or \`yarn why\` / \`pnpm why\`) to find what pulls in the second copy, deduplicate it with \`npm dedupe\` (or \`yarn dedupe\` / \`pnpm dedupe\`), then re-run \`npx react-native spm update\`.`,
      ].join('\n')
    )
    .join('\n\n');
}

// CocoaPods accepts only one ref; a pod carrying two is named by the most specific.
const GIT_REFS = ['commit', 'tag', 'branch'];

// A git pod is named by its ref, not a version; a local path pod by neither.
function extraPodOrigin(pod) {
  const versioned = (origin) =>
    pod.version != null ? `${origin}, version ${pod.version}` : origin;
  if (pod.path != null) return `local path: ${pod.path}`;
  if (pod.git != null) {
    const ref = GIT_REFS.find((key) => pod[key] != null);
    return ref != null ? `git: ${pod.git}, ${ref} ${pod[ref]}` : versioned(`git: ${pod.git}`);
  }
  if (pod.podspec != null) return versioned(`podspec: ${pod.podspec}`);
  if (pod.source != null) return versioned(`spec repo: ${pod.source}`);
  return versioned('published pod');
}

function renderExtraPodsWarning(pods) {
  if (!pods.length) return '';
  const one = pods.length === 1;
  return [
    `warning: This app declares ${pods.length} extra CocoaPods ${one ? 'dependency' : 'dependencies'}, and the Swift Package Manager plugin does not install ${one ? 'it' : 'them'}:`,
    ...pods.map((pod) => `      ${pod.name} (${extraPodOrigin(pod)})`),
    `  ${one ? 'It comes' : 'They come'} from \`extraPods\` in your app config, which expo-build-properties writes into ios/Podfile.properties.json. The plugin reads that file — that is how ${one ? 'the pod is' : 'these pods are'} named here — but it contributes no CocoaPods dependency to the Swift Package Manager graph, whatever ${one ? 'it is' : 'they are'} installed from.`,
    `  Native code that imports ${one ? 'it' : 'one of them'} fails to compile or link. Code that reaches a pod at runtime instead — a class looked up by name, an Objective-C category, a bundled resource — builds and then fails on device, so a pod nothing imports is not necessarily unused.`,
    `  There is no Swift Package Manager route for ${one ? 'it' : 'them'} today. Add a Swift package providing the same code to your Xcode project and drop the \`extraPods\` entry, or keep this app on CocoaPods.`,
  ].join('\n');
}

/** Print the report and return the error to throw, or null when nothing is uncovered. */
function reportUnsupported(entries) {
  if (!entries.length) return null;
  console.error(renderUnsupportedReport(entries));
  return new UnsupportedModulesError(entries);
}

module.exports = {
  pluginError,
  UnsupportedModulesError,
  COVERED_POD_PREFIXES,
  UNMAPPED_POD_ALLOWLIST,
  classifyUnsupported,
  unmappedPodDependencies,
  collectDuplicatePods,
  collectRootConflicts,
  renderUnsupportedReport,
  renderUnmappedDependencyWarning,
  renderXcconfigLinkerWarning,
  renderRootConflictWarning,
  renderExtraPodsWarning,
  reportUnsupported,
};
