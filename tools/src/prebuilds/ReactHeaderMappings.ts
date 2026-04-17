/**
 * Podspec parser and header collection for React Native.
 *
 * Ported from react-native's `scripts/ios-prebuild/headers.js`.
 * Discovers all podspecs in the RN source tree, parses their header patterns,
 * and returns structured header mappings (source → target) for each pod.
 */

import fs from 'fs-extra';
import { glob } from 'glob';
import path from 'path';

import { PodspecExceptions, PodSpecConfiguration } from './ReactHeaderConfig';

export interface HeaderEntry {
  source: string;
  target: string;
}

export interface HeaderMap {
  headerDir: string;
  specName: string;
  headers: HeaderEntry[];
}

export type PodspecHeaderMappings = Record<string, HeaderMap[]>;

/**
 * Collects header file mappings from all podspecs in the React Native source tree.
 * Uses PodspecExceptions for complex podspecs and regex-based parsing for simple ones.
 */
export function getHeaderFilesFromPodspecs(rootFolder: string): PodspecHeaderMappings {
  const result: PodspecHeaderMappings = {};

  const podspecFiles = glob.sync('**/*.podspec', {
    cwd: rootFolder,
    absolute: true,
    ignore: ['**/node_modules/**', '**/Pods/**'],
  });

  podspecFiles.forEach((podspecPath) => {
    const relativeKey = path.relative(rootFolder, podspecPath);
    const exception = PodspecExceptions[relativeKey];

    if (exception) {
      if ('disabled' in exception && exception.disabled === true) {
        return;
      }

      const headerMaps = getHeaderFilesFromPodspec(
        exception as PodSpecConfiguration,
        path.dirname(podspecPath)
      );
      if (headerMaps !== null) {
        result[podspecPath] = headerMaps;
      }
      return;
    }

    const fileContent = fs.readFileSync(podspecPath, 'utf8');

    // Try to infer header_dir from string literal assignments
    const headerDirMatch = fileContent.match(/\.header_dir\s*=\s*(['"])([^'"\n]+)\1/);
    const inferredHeaderDir = headerDirMatch ? headerDirMatch[2].trim() : '';

    if (fileContent.includes('podspec_sources')) {
      // Parse podspec_sources(source_files, header_patterns)
      const headerPatternRegex =
        /podspec_sources\((?:\[[^\]]*\]|"[^"]*"|\w+)\s*,\s*(\[[^\]]*\]|"[^"]*")\)/gm;
      const matches = [...fileContent.matchAll(headerPatternRegex)];

      // Extract exclude_files patterns
      const excludeFilesRegex = /\.exclude_files\s*=\s*(\[[^\]]*\]|"[^"]*")/gm;
      const excludeMatches = [...fileContent.matchAll(excludeFilesRegex)];

      const excludePatterns = excludeMatches.flatMap((match) => {
        const arg = match[1].trim();
        if (arg.startsWith('[')) {
          const arrayContent = arg.slice(1, arg.lastIndexOf(']'));
          return arrayContent
            .split(',')
            .map((s) => s.trim().replace(/['"]/g, ''))
            .filter((s) => s.length > 0);
        } else {
          return [arg.replace(/['"]/g, '').trim()].filter((s) => s.length > 0);
        }
      });

      if (matches.length > 0) {
        const patterns = matches.flatMap((match) => {
          const secondArg = match[1].trim();

          if (secondArg.startsWith('[')) {
            const arrayContent = secondArg.slice(1, secondArg.lastIndexOf(']'));
            return arrayContent
              .split(',')
              .map((s) => s.trim().replace(/['"]/g, ''))
              .filter((s) => s.length > 0);
          } else {
            return [secondArg.replace(/['"]/g, '').trim()].filter((s) => s.length > 0);
          }
        });

        const foundHeaderFiles = patterns
          .map((pattern) => {
            // glob doesn't like {h} patterns, normalize to just h
            if (pattern.includes('{h}')) {
              pattern = pattern.replaceAll('{h}', 'h');
            }
            return glob.sync(pattern, {
              cwd: path.dirname(podspecPath),
              ignore: excludePatterns,
              absolute: true,
            });
          })
          .flat();

        result[podspecPath] = [
          {
            headerDir: inferredHeaderDir,
            specName: path.basename(podspecPath, '.podspec'),
            headers: foundHeaderFiles.map((headerFile) => ({
              source: headerFile,
              target: inferredHeaderDir
                ? path.join(inferredHeaderDir, path.basename(headerFile))
                : path.basename(headerFile),
            })),
          },
        ];
      }
    }
  });

  return result;
}

/**
 * Extracts header files from a single podspec based on its configuration.
 */
function getHeaderFilesFromPodspec(
  podSpecConfig: PodSpecConfiguration,
  podSpecDirectory: string
): HeaderMap[] | null {
  if (!podSpecConfig || !podSpecConfig.name) {
    return null;
  }

  const headerMaps: HeaderMap[] = [];

  const processConfig = (config: PodSpecConfiguration, parents: PodSpecConfiguration[]) => {
    if (config.disabled === true) {
      return;
    }

    const { headerDir, headerPatterns, excludePatterns, subSpecs } = config;

    const foundHeaderFiles = headerPatterns
      .map((pattern) =>
        glob.sync(pattern, {
          cwd: podSpecDirectory,
          absolute: true,
          ignore: excludePatterns || [],
        })
      )
      .flat();

    let resolvedHeaderDir = headerDir || '';

    // Resolve headerDir from parent specs if not set
    if (parents.length > 0 && !headerDir) {
      for (let i = parents.length - 1; i >= 0; i--) {
        const parentHeaderDir = parents[i].headerDir;
        if (parentHeaderDir) {
          resolvedHeaderDir = parentHeaderDir;
          break;
        }
      }
    }

    if (!resolvedHeaderDir) {
      resolvedHeaderDir = '';
    }

    // Resolve preservePaths from parent specs
    let resolvedPreservePaths = config.preservePaths || [];
    if (resolvedPreservePaths.length === 0 && parents.length > 0) {
      for (let i = parents.length - 1; i >= 0; i--) {
        const parentPreservePaths = parents[i].preservePaths;
        if (parentPreservePaths && parentPreservePaths.length > 0) {
          resolvedPreservePaths = parentPreservePaths;
          break;
        }
      }
    }

    headerMaps.push({
      headerDir: resolvedHeaderDir,
      specName: config.name,
      headers: foundHeaderFiles.map((headerFile) => {
        // Check if this header has a preserved path
        const isPreserved = resolvedPreservePaths.some((preservePattern) => {
          return glob
            .sync(preservePattern, {
              cwd: podSpecDirectory,
              absolute: true,
              ignore: excludePatterns || [],
            })
            .includes(headerFile);
        });

        if (isPreserved) {
          const relativePath = path.dirname(path.relative(podSpecDirectory, headerFile));
          return {
            source: headerFile,
            target: path.join(relativePath, path.basename(headerFile)),
          };
        }
        return {
          source: headerFile,
          target: path.join(resolvedHeaderDir, path.basename(headerFile)),
        };
      }),
    });

    // Process subSpecs recursively
    if (subSpecs && subSpecs.length > 0) {
      subSpecs.forEach((subSpecConfig) => {
        processConfig(subSpecConfig, [config, ...parents]);
      });
    }
  };

  processConfig(podSpecConfig, []);

  return headerMaps;
}
