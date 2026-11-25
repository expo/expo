import { type ConfigPlugin, withProjectBuildGradle } from 'expo/config-plugins';

import type { PluginConfig, Publication } from '../types';
import { addRepository } from '../utils';

const EXPO_APPLY_STATEMENT = 'apply plugin: "expo-root-project"';
const PLUGIN_CLASSPATH = 'expo.modules:publish';
const PLUGIN_NAME = 'expo-brownfield-publish';

// AGP 8.12.0's Fused Library plugin's `rewriteClasses` task uses an ASM API version
// below 9 at the call site and can't read `PermittedSubclasses` bytecode attributes
// emitted for every Kotlin `sealed class`. AGP 8.13.0+ raises the hardcoded API
// version. Bump only when the user opts into fused mode via `--fused` (which passes
// `-Pbrownfield.fused=true`), so default builds keep using the version catalog's AGP.
const FUSED_AGP_VERSION = '8.13.0';
const FUSED_AGP_MARKER = 'brownfield.fused';

const withProjectBuildGradlePlugin: ConfigPlugin<PluginConfig> = (config, pluginConfig) => {
  return withProjectBuildGradle(config, (config) => {
    let lines = config.modResults.contents.split('\n');

    if (!config.modResults.contents.includes(FUSED_AGP_MARKER)) {
      lines = addFusedAgpResolutionStrategy(lines);
    }

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

    config.modResults.contents = lines.join('\n');

    return config;
  });
};

const addFusedAgpResolutionStrategy = (lines: string[]): string[] => {
  // Appended as a sibling top-level `buildscript { ... }` block. Gradle merges multiple
  // top-level buildscript blocks, so this composes with the project's existing one
  // without clobbering it. The `findProperty` check makes the override conditional on
  // `-Pbrownfield.fused=true` (set by `expo-brownfield build:android --fused`); without
  // the flag the resolution-strategy block never runs and AGP stays at the catalog
  // version.
  const block = [
    '',
    'buildscript {',
    '  // expo-brownfield: bump AGP only when `--fused` is active (CLI passes',
    `  // -P${FUSED_AGP_MARKER}=true). AGP 8.12.0's Fused Library can't read Kotlin`,
    '  // sealed-class bytecode (PermittedSubclasses requires ASM API >= 9, fixed',
    `  // in AGP ${FUSED_AGP_VERSION}).`,
    `  if (findProperty('${FUSED_AGP_MARKER}') == 'true') {`,
    '    configurations.classpath {',
    `      resolutionStrategy.force 'com.android.tools.build:gradle:${FUSED_AGP_VERSION}'`,
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
