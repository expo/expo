/**
 * The facts about the app's Xcode target that the modules-provider generator
 * needs and RN's `PluginContext` does not carry: the target name, the
 * code-signing entitlements file, and the Podfile properties file. CocoaPods
 * reads all three off the target it integrates (project_integrator.rb); under
 * SwiftPM the plugin never sees that target, so each is derived from disk.
 */

'use strict';

const { IOSConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Not a dependency of this package; resolving it through config-plugins also
// yields the exact parser IOSConfig's helpers expect.
const xcode = require(
  require.resolve('xcode', { paths: [path.dirname(require.resolve('@expo/config-plugins'))] })
);

const { pluginError } = require('./diagnostics');

/** Written by RN's SwiftPM injector into the .xcodeproj it modified. */
const INJECTION_MARKER = '.spm-injected.json';

/** In the order IOSConfig.Paths.getAllPBXProjectPaths picks them, which prebuild writes through. */
function listXcodeProjects(appRoot) {
  try {
    return fs
      .readdirSync(appRoot)
      .filter((name) => name.endsWith('.xcodeproj'))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => path.join(appRoot, name))
      .filter((project) => isFile(path.join(project, 'project.pbxproj')));
  } catch {
    return [];
  }
}

/**
 * The project RN injected into and the target it names, per the marker on disk.
 *
 * Deliberately not `process.env.TARGET_NAME`: the plugin runs both outside
 * Xcode (`react-native spm sync`) and inside a build, and for the test target
 * as well as the app target. A value that differs between those runs would
 * rewrite the provider's contents each time, and the generator only
 * short-circuits when the contents are unchanged — so every switch would
 * recompile the registry. The marker names the target that actually compiles
 * the provider, whoever is asking.
 */
function readInjectionMarker(appRoot, projects) {
  const markers = projects
    .map((project) => path.join(project, INJECTION_MARKER))
    .filter((marker) => fs.existsSync(marker));
  if (markers.length > 1) {
    // RN injects into the first project it finds; matching that guess could
    // register inline modules against a target nobody builds. Say so instead —
    // a dropped --target-name is otherwise invisible until runtime.
    console.warn(
      `[expo-spm-plugin] WARNING: ${markers.length} Xcode projects under ${appRoot} carry a SwiftPM ` +
        `injection marker (${markers.map((m) => path.basename(path.dirname(m))).join(', ')}), so the app ` +
        `target is ambiguous and inline modules will not be registered. Delete the marker of the project you no longer build.`
    );
  }
  if (markers.length !== 1) return null;
  const project = path.dirname(markers[0]);
  try {
    const { target } = JSON.parse(fs.readFileSync(markers[0], 'utf8'));
    return { project, targetName: typeof target === 'string' && target.length > 0 ? target : null };
  } catch {
    return { project, targetName: null };
  }
}

function isFile(candidate) {
  try {
    return fs.statSync(candidate).isFile();
  } catch {
    return false;
  }
}

const WARNING = '[expo-spm-plugin] WARNING:';

/** Xcode expands both `$(SRCROOT)` and `${SRCROOT}`; neither can be expanded here. */
const BUILD_VARIABLE = /\$[({]/;

function warnUnreadableProject(appRoot, projectPath, error) {
  console.warn(
    `${WARNING} the Xcode project ${projectPath ?? `under ${appRoot}`} could not be read ` +
      `(${error.message}), so the Expo module registry will report no app groups. Modules that ` +
      'rely on an app group will not find one at runtime.'
  );
}

/** The native target the registry is generated for, with its project, or null. */
function findTarget(appRoot, projectPath, targetName) {
  let project;
  try {
    if (projectPath == null) throw new Error('no .xcodeproj with a project.pbxproj was found');
    project = xcode.project(path.join(projectPath, 'project.pbxproj'));
    project.parseSync();
  } catch (error) {
    warnUnreadableProject(appRoot, projectPath, error);
    return null;
  }
  try {
    const [, target] =
      targetName != null
        ? IOSConfig.Target.findNativeTargetByName(project, targetName)
        : IOSConfig.Target.findFirstNativeTarget(project);
    return { project, target };
  } catch {
    console.warn(
      targetName != null
        ? `${WARNING} the Xcode project under ${appRoot} has no target "${targetName}", which is the ` +
            `target its SwiftPM injection marker names, so the Expo module registry will report no app ` +
            `groups. The target was most likely renamed after the last sync — re-run ` +
            '`npx react-native spm update` to re-inject it.'
        : `${WARNING} the Xcode project under ${appRoot} has no application target, so the Expo module ` +
            'registry will report no app groups. Regenerate the project with `npx expo prebuild`.'
    );
    return null;
  }
}

/**
 * The app target's CODE_SIGN_ENTITLEMENTS file. Without it the generated
 * provider reports empty app groups to every module that asks for them.
 *
 * Every build configuration of the target is scanned, because an app that signs
 * entitlements only in Debug still needs them in the registry. Where they
 * disagree the first file that EXISTS wins — CocoaPods takes the first declared
 * one, but a declared path with nothing behind it yields an empty registry, and
 * the configurations are not iterated in the order the target lists them anyway.
 */
function findEntitlementsFile(appRoot, projectPath, targetName) {
  const found = findTarget(appRoot, projectPath, targetName);
  if (found == null) return null;
  const { project, target } = found;
  const name = IOSConfig.XcodeUtils.unquote(String(target.name));

  let configurations;
  try {
    configurations = IOSConfig.XcodeUtils.getBuildConfigurationsForListId(
      project,
      target.buildConfigurationList
    );
  } catch (error) {
    warnUnreadableProject(appRoot, projectPath, error);
    return null;
  }

  const declared = [];
  for (const [, configuration] of configurations) {
    const setting = configuration.buildSettings?.CODE_SIGN_ENTITLEMENTS;
    if (setting == null) continue;
    const value = IOSConfig.XcodeUtils.unquote(String(setting)).trim();
    // An empty setting would resolve to the project directory, which exists.
    if (value.length === 0) continue;
    if (BUILD_VARIABLE.test(value)) {
      console.warn(
        `${WARNING} target "${name}" builds its entitlements path from Xcode build settings ` +
          `(${value}), which cannot be expanded here, so that configuration is ignored while ` +
          `generating the Expo module registry.`
      );
      continue;
    }
    const file = path.resolve(appRoot, value);
    if (!declared.includes(file)) declared.push(file);
  }

  const entitlementPath = declared.find(isFile) ?? null;
  // Declaring nothing is the common case and needs no comment; declaring
  // something that is not there always does.
  if (entitlementPath == null && declared.length > 0) {
    console.warn(
      `${WARNING} target "${name}" declares an entitlements file that is not on disk ` +
        `(${declared.join(', ')}), so the Expo module registry will report no app groups. Point ` +
        'CODE_SIGN_ENTITLEMENTS at the file the target really uses, then re-run ' +
        '`npx react-native spm update`.'
    );
  } else if (declared.length > 1) {
    console.warn(
      `${WARNING} the build configurations of target "${name}" declare different entitlements ` +
        `files. Generating the Expo module registry against ${entitlementPath}, ignoring ` +
        `${declared.filter((file) => file !== entitlementPath).join(', ')}.`
    );
  }
  return entitlementPath;
}

/**
 * @param appRoot the Xcode project directory (`<app>/ios`), i.e. `context.appRoot`.
 * @returns each value, or null when it cannot be derived unambiguously — the
 * generator then falls back to what it does for an app that has none.
 */
function resolveAppTarget(appRoot) {
  const projects = listXcodeProjects(appRoot);
  const marker = readInjectionMarker(appRoot, projects);
  const targetName = marker?.targetName ?? null;
  const podfilePropertiesPath = path.join(appRoot, 'Podfile.properties.json');
  return {
    targetName,
    entitlementPath: findEntitlementsFile(appRoot, marker?.project ?? projects[0], targetName),
    podfilePropertiesPath: fs.existsSync(podfilePropertiesPath) ? podfilePropertiesPath : null,
  };
}

/**
 * Podfile.properties.json (as precompiled_modules.rb#read_podfile_properties). Missing → {};
 * present but unusable → throw, since every gate would silently fall to its default.
 */
function readPodfileProperties(propertiesPath) {
  if (typeof propertiesPath !== 'string' || propertiesPath.length === 0) return {};
  let properties;
  try {
    properties = JSON.parse(fs.readFileSync(propertiesPath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw unusablePropertiesError(propertiesPath, error.message, { cause: error });
  }
  if (properties == null || typeof properties !== 'object' || Array.isArray(properties)) {
    throw unusablePropertiesError(
      propertiesPath,
      `it holds ${describeType(properties)}, not an object`
    );
  }
  return properties;
}

/** Type only: JSON.stringify can overflow on a deep payload. */
function describeType(payload) {
  if (payload === null) return 'null';
  return Array.isArray(payload) ? 'an array' : `a ${typeof payload}`;
}

function unusablePropertiesError(propertiesPath, reason, options) {
  return pluginError(
    {
      what: `${propertiesPath} could not be read as Podfile properties (${reason}), so the plugin cannot tell which products this app links.`,
      why: "Carrying on would read every property as unset and leave each gated product to its own default instead of the app's configuration, which only shows up at runtime, so the sync stops here.",
      how: 'Restore the file to a JSON object of properties, then re-run `npx react-native spm update`.',
    },
    options
  );
}

module.exports = { readPodfileProperties, resolveAppTarget };
