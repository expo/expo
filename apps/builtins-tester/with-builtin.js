const { withXcodeProject, IOSConfig } = require('expo/config-plugins');

module.exports = function (config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;

    IOSConfig.XcodeUtils.addResourceFileToGroup({
      filepath: 'builtinstester/builtins.hbc',
      project,
      groupName: 'builtinstester',
      isBuildFile: false,
      verbose: true,
    });

    return config;
  });
};
