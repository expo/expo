const { withMainApplication } = require('expo/config-plugins');

function addBenchmarkingPackages(mainApplication) {
  if (mainApplication.includes('expo.modules.benchmark.withBenchmarkingPackages')) {
    return mainApplication;
  }

  return mainApplication.replace(
    'PackageList(this).packages',
    'expo.modules.benchmark.withBenchmarkingPackages(PackageList(this).packages)'
  );
}

const withBenchmarkModules = (config) => {
  return withMainApplication(config, (config) => {
    config.modResults.contents = addBenchmarkingPackages(config.modResults.contents);
    return config;
  });
};

module.exports = withBenchmarkModules;
