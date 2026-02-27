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

export const addNewPodsTarget = (podfile: string, targetName: string): string => {
  const targetLines = getTargetNameLines(targetName);
  let podFileLines = podfile.split('\n');
  if (podFileLines.find((line) => line.includes(targetLines[0].trim()))) {
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
  if (podFileLines.find((line) => line.includes(prebuiltSettingsLines[4].trim()))) {
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
