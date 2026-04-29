const getTargetNameLines = (targetName: string): string[] => {
  return [`  target '${targetName}' do`, '    inherit! :complete', '  end'];
};

/**
 * Ensure that we disable SWIFT_VERIFY_EMITTED_MODULE_INTERFACE option
 * and include -no-verify-emitted-module-interface in OTHER_SWIFT_FLAGS
 * for all targets in the pods project in order for consuming prebuilt RN
 * frameworks to work
 */
const getPrebuiltSettingsLines = (): string[] => {
  return `    installer.pods_project.targets.each do |t|
      t.build_configurations.each do |config|
        config.build_settings['SWIFT_VERIFY_EMITTED_MODULE_INTERFACE'] = 'NO'
        flags = config.build_settings['OTHER_SWIFT_FLAGS'] || '$(inherited)'
        config.build_settings['OTHER_SWIFT_FLAGS'] = "#{flags} -no-verify-emitted-module-interface"
      end
    end`.split('\n');
};

const MANGLE_REQUIRE_MARKER = "require File.join(File.dirname(`node --print \"require.resolve('expo-brownfield/package.json')\"`), 'scripts/ios/mangle')";
const MANGLE_RUN_MARKER = 'ExpoBrownfield::Mangle.run!';

const getMangleRunLines = (targetName: string): string[] => {
  return [
    `    ExpoBrownfield::Mangle.run!(installer, targets: ['${targetName}'], mangle_prefix: '${targetName}_')`,
  ];
};

/**
 * Wire up expo-brownfield's bundled mangling logic in the Podfile.
 * Replaces the third-party `cocoapods-mangle` gem so users don't need a
 * Gemfile entry. Two insertions:
 *   1. A `require` line near the top of the Podfile that loads
 *      `scripts/ios/mangle.rb` from the expo-brownfield npm package.
 *   2. A `ExpoBrownfield::Mangle.run!(installer, ...)` call inside the
 *      `post_install` block (created if absent) that invokes the
 *      bundled Node worker to generate the mangling xcconfig.
 *
 * Both insertions are idempotent — re-running prebuild against an already
 * patched Podfile is a no-op.
 */
export const addManglePlugin = (podfile: string, targetName: string): string => {
  let result = addMangleRequire(podfile);
  result = addMangleRunCall(result, targetName);
  return result;
};

const addMangleRequire = (podfile: string): string => {
  if (podfile.includes(MANGLE_REQUIRE_MARKER)) {
    return podfile;
  }

  const lines = podfile.split('\n');
  // Insert after the last existing `require ` line (typically the
  // react_native_pods/autolinking requires) so we sit alongside them.
  const lastRequireIndex = lines.reduce((acc, line, index) => {
    if (line.trimStart().startsWith('require ')) {
      return index;
    }
    return acc;
  }, -1);

  const insertAt = lastRequireIndex >= 0 ? lastRequireIndex + 1 : 0;
  lines.splice(insertAt, 0, MANGLE_REQUIRE_MARKER);
  return lines.join('\n');
};

const addMangleRunCall = (podfile: string, targetName: string): string => {
  if (podfile.includes(MANGLE_RUN_MARKER)) {
    return podfile;
  }

  const runLines = getMangleRunLines(targetName);
  const lines = podfile.split('\n');

  const postInstallIndex = lines.findIndex((line) =>
    line.includes('post_install do |installer|')
  );

  if (postInstallIndex === -1) {
    // No post_install block exists yet — append one at the bottom.
    lines.push('', 'post_install do |installer|', ...runLines, 'end');
    return lines.join('\n');
  }

  const blockEnd = lines.findIndex(
    (line, index) => index > postInstallIndex && /^\s*end\s*$/.test(line)
  );

  if (blockEnd === -1) {
    return podfile;
  }

  lines.splice(blockEnd, 0, ...runLines);
  return lines.join('\n');
};

export const addNewPodsTarget = (podfile: string, targetName: string): string => {
  const targetLines = getTargetNameLines(targetName);
  let podFileLines = podfile.split('\n');
  if (podFileLines.find((line) => targetLines[0] != null && line.includes(targetLines[0].trim()))) {
    console.info(`Target for ${targetName} is already added. Skipping...`);
    return podfile;
  }

  const insertBefore = podFileLines.findLastIndex((line) => line === 'end');
  podFileLines = [
    ...podFileLines.slice(0, insertBefore),
    '', // new line for nicer output
    ...targetLines,
    ...podFileLines.slice(insertBefore),
  ];

  return podFileLines.join('\n');
};

export const addPrebuiltSettings = (podfile: string): string => {
  const prebuiltSettingsLines = getPrebuiltSettingsLines();
  let podFileLines = podfile.split('\n');

  if (
    podFileLines.find(
      (line) => prebuiltSettingsLines[4] != null && line.includes(prebuiltSettingsLines[4].trim())
    )
  ) {
    console.info('Prebuilt settings are already added. Skipping...');
    return podfile;
  }

  const postInstallIndex = podFileLines.findIndex((line) =>
    line.includes('post_install do |installer|')
  );
  const insertBefore = podFileLines.findIndex(
    (line, index) => line.includes('end') && index > postInstallIndex
  );
  podFileLines = [
    ...podFileLines.slice(0, insertBefore),
    '', // new line for nicer output
    ...prebuiltSettingsLines,
    ...podFileLines.slice(insertBefore),
  ];

  return podFileLines.join('\n');
};
