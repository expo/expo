import { CodeGenerator, withPodfile, type ConfigPlugin } from 'expo/config-plugins';

import { PluginConfigType, resolveConfigValue } from './pluginConfig';

type MergeResults = ReturnType<typeof CodeGenerator.mergeContents>;

const TAG = 'expo-fmt-use-consteval-fix';

const FMT_FIX_RUBY = [
  "    if podfile_properties['ios.buildReactNativeFromSource'] == 'true'",
  "      fmt_base = File.join(installer.sandbox.root.to_s, 'fmt', 'include', 'fmt', 'base.h')",
  '      if File.exist?(fmt_base)',
  '        content = File.read(fmt_base)',
  "        patched = content.gsub(/#\\s*define FMT_USE_CONSTEVAL 1/, '# define FMT_USE_CONSTEVAL 0')",
  '        if patched != content',
  '          File.chmod(0644, fmt_base)',
  '          File.write(fmt_base, patched)',
  '        end',
  '      end',
  '    end',
].join('\n');

/**
 * @returns index of the character after the closing `)` of `react_native_post_install(...)`, or -1 if not found.
 */
function findIndexAfterReactNativePostInstallCall(src: string): number {
  const start = src.indexOf('react_native_post_install');
  if (start === -1) {
    return -1;
  }
  const openParen = src.indexOf('(', start);
  if (openParen === -1) {
    return -1;
  }
  let depth = 0;
  for (let i = openParen; i < src.length; i++) {
    const c = src[i];
    if (c === '(') {
      depth++;
    } else if (c === ')') {
      depth--;
      if (depth === 0) {
        return i + 1;
      }
    }
  }
  return -1;
}

/**
 * Returns the full line containing the closing `)` of `react_native_post_install`, for use as mergeContents anchor.
 */
function getReactNativePostInstallClosingLine(src: string): string | null {
  const endIdx = findIndexAfterReactNativePostInstallCall(src);
  if (endIdx === -1) {
    return null;
  }
  const before = src.slice(0, endIdx);
  const lines = before.split('\n');
  return lines[lines.length - 1] ?? null;
}

export function addFmtConstevalFixToPodfile(src: string): MergeResults {
  const anchorLine = getReactNativePostInstallClosingLine(src);
  if (!anchorLine) {
    return { contents: src, didMerge: false, didClear: false };
  }

  return CodeGenerator.mergeContents({
    tag: TAG,
    src,
    newSrc: FMT_FIX_RUBY,
    anchor: new RegExp(`^${escapeRegExp(anchorLine)}$`),
    offset: 1,
    comment: '#',
  });
}

export function removeFmtConstevalFixFromPodfile(src: string): MergeResults {
  return CodeGenerator.removeContents({
    tag: TAG,
    src,
  });
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Patches `fmt`'s `base.h` after `pod install` when building React Native from source, so Apple Clang in
 * Xcode 26.4+ can compile `FMT_STRING` (see https://github.com/expo/expo/issues/44229).
 */
export const withIosFmtConstevalFix: ConfigPlugin<PluginConfigType> = (config, props) => {
  const buildFromSource = resolveConfigValue(props, 'ios', 'buildReactNativeFromSource') === true;

  return withPodfile(config, async (config) => {
    let results: MergeResults;

    if (buildFromSource) {
      try {
        results = addFmtConstevalFixToPodfile(config.modResults.contents);
      } catch (error: any) {
        if (error.code === 'ERR_NO_MATCH') {
          throw new Error(
            `Cannot add fmt consteval workaround to the project's ios/Podfile because it's missing a recognizable react_native_post_install call. Report this with a copy of your Podfile: https://github.com/expo/expo/issues`
          );
        }
        throw error;
      }
    } else {
      results = removeFmtConstevalFixFromPodfile(config.modResults.contents);
    }

    if (results.didMerge || results.didClear) {
      config.modResults.contents = results.contents;
    }

    return config;
  });
};
