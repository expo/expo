const getTargetNameLines = (targetName: string): string[] => {
  return [`  target '${targetName}' do`, '    inherit! :complete', '  end'];
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
