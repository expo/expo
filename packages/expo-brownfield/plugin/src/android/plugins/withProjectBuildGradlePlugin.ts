import { type ConfigPlugin, withProjectBuildGradle } from 'expo/config-plugins';

import type { PluginConfig, Publication } from '../types';
import { addRepository } from '../utils';

const EXPO_APPLY_STATEMENT = 'apply plugin: "expo-root-project"';
const PLUGIN_CLASSPATH = 'expo.modules:publish';
const PLUGIN_NAME = 'expo-brownfield-publish';

// AGP 8.12.0's Fused Library plugin's `rewriteClasses` task uses an ASM API version
// below 9 at the call site and can't read `PermittedSubclasses` bytecode attributes
// emitted for every Kotlin `sealed class`. AGP 8.13.0+ raises the hardcoded API
// version. Applied only when the user opts into fused mode via `--fused` (which passes
// `-Pbrownfield.fused=true`), so default builds keep using the version catalog's AGP.
const FUSED_AGP_MIN_VERSION = '8.13.0';
const FUSED_AGP_MARKER = 'brownfield.fused';

const withProjectBuildGradlePlugin: ConfigPlugin<PluginConfig> = (config, pluginConfig) => {
  return withProjectBuildGradle(config, (config) => {
    let lines = config.modResults.contents.split('\n');

    // Order matters: `addPluginClasspathStatement` inserts after the last line containing
    // `classpath(`, and the fused block declares a constraint on `classpath(...)`. Appending
    // that block first would make it the last match and the plugin classpath would land
    // inside the constraint. Add the classpath statement first, then append the block.
    if (!config.modResults.contents.includes(PLUGIN_CLASSPATH)) {
      lines = addPluginClasspathStatement(lines);
      lines = addApplyStatement(lines);
      lines = addPublicationConfiguration(
        lines,
        pluginConfig.publishing,
        pluginConfig.projectRoot,
        pluginConfig.libraryName
      );
    }

    if (!config.modResults.contents.includes(FUSED_AGP_MARKER)) {
      lines = addFusedAgpResolutionStrategy(lines);
    }

    config.modResults.contents = lines.join('\n');

    return config;
  });
};

const addFusedAgpResolutionStrategy = (lines: string[]): string[] => {
  // Appended as a sibling top-level `buildscript { ... }` block. Gradle merges multiple
  // top-level buildscript blocks, so this composes with the project's existing one
  // without clobbering it. The `findProperty` check makes the override conditional on
  // `-Pbrownfield.fused=true` (set by `expo-brownfield build:android --fused`); without
  // the flag the constraint is never declared and AGP stays at the catalog version.
  //
  // Declared as a constraint with `require` (a floor) rather than `resolutionStrategy.force`
  // (a pin). Forcing pinned every fused build to 8.13.0 even on newer AGP, which downgrades
  // React Native's Gradle plugin below the AGP it was compiled against — on RN 0.87 that is
  // AGP 9.2.1, and the mismatch fails at configuration time with:
  //   NoSuchMethodError: ApplicationExtension.getBuildFeatures()
  const block = [
    '',
    'buildscript {',
    '  // expo-brownfield: require a minimum AGP only when `--fused` is active (CLI passes',
    `  // -P${FUSED_AGP_MARKER}=true). AGP 8.12.0's Fused Library can't read Kotlin`,
    '  // sealed-class bytecode (PermittedSubclasses requires ASM API >= 9, fixed',
    `  // in AGP ${FUSED_AGP_MIN_VERSION}). Newer AGP still wins.`,
    `  if (findProperty('${FUSED_AGP_MARKER}') == 'true') {`,
    '    dependencies {',
    '      constraints {',
    "        classpath('com.android.tools.build:gradle') {",
    `          version { require '${FUSED_AGP_MIN_VERSION}' }`,
    '        }',
    '      }',
    '    }',
    '  }',
    '}',
  ];
  return [...lines, ...block];
};

const addPluginClasspathStatement = (lines: string[]): string[] => {
  const statement = `    classpath('${PLUGIN_CLASSPATH}')`;
  const lastClasspathIndex = lines.findLastIndex((line) => line.includes('classpath('));

  lines = [
    ...lines.slice(0, lastClasspathIndex + 1),
    statement,
    ...lines.slice(lastClasspathIndex + 1),
  ];

  return lines;
};

const addApplyStatement = (lines: string[]): string[] => {
  const statement = `apply plugin: "${PLUGIN_NAME}"`;
  const expoApplyIndex = lines.findIndex((line) => line.includes(EXPO_APPLY_STATEMENT));

  if (expoApplyIndex === -1) {
    throw new Error(
      'Error: "expo-root-project" apply statement not found in the project build.gradle file'
    );
  }

  lines = [...lines.slice(0, expoApplyIndex + 1), statement, ...lines.slice(expoApplyIndex + 1)];

  return lines;
};

const addPublicationConfiguration = (
  lines: string[],
  publications: Publication[],
  projectRoot: string,
  libraryName: string
): string[] => {
  lines = [
    ...lines,
    'expoBrownfieldPublishPlugin {',
    getBrownfieldLibraryConfiguration(libraryName),
    '  publications {',
    ...createPublicationConfigurations(publications, projectRoot),
    '  }',
    '}',
  ];

  return lines;
};

const createPublicationConfigurations = (
  publications: Publication[],
  projectRoot: string
): string[] => {
  const configs: string[] = [];
  publications.forEach((publication) => {
    configs.push(...addRepository(configs, projectRoot, publication));
  });

  return configs;
};

const getBrownfieldLibraryConfiguration = (libraryName: string): string => {
  return `  libraryName = "${libraryName}"`;
};

export default withProjectBuildGradlePlugin;
