const getTargetNameLines = (targetName: string): string[] => {
  return [`  target '${targetName}' do`, '    inherit! :complete', '  end'];
};

const getCustomScriptLines = (): string[] => [
  'require File.join(File.dirname(`node --print "require.resolve(\'expo-brownfield/package.json\')"`), "plugin/src/ios/scripts/reorder_build_phases.rb")',
];

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

export const addCustomRubyScriptImport = (podfile: string, targetName: string) => {
  const requireLines = getCustomScriptLines();
  let podFileLines = podfile.split('\n');
  if (podFileLines.find((line) => line.includes(requireLines[0].trim()))) {
    console.info('Require for custom script is already added. Skipping...');
    return podfile;
  }

  podFileLines = [...requireLines, ...podFileLines];

  return podFileLines.join('\n');
};
