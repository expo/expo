const { withProjectBuildGradle } = require('@expo/config-plugins');
const kotlinClassPath = 'org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion';

const withKotlinGradle = (config, version) => {
  return withProjectBuildGradle(config, config => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = setKotlinVersion(config.modResults.contents, version);
      config.modResults.contents = setKotlinClassPath(config.modResults.contents);
    } else {
      throw new Error('Cannot setup kotlin because the build.gradle is not groovy');
    }
    return config;
  });
};

function setKotlinVersion(buildGradle, version) {
  const pattern = /kotlinVersion\s?=\s?(["'])(?:(?=(\\?))\2.)*?\1/g;
  const replacement = `kotlinVersion = "${version}"`;
  if (buildGradle.match(pattern)) {
    // Select kotlinVersion = '***' and replace the contents between the quotes.
    return buildGradle.replace(pattern, replacement);
  }
  return buildGradle.replace(
    /ext\s?{/,
    `ext {
        ${replacement}`
  );
}

function setKotlinClassPath(buildGradle) {
  if (buildGradle.includes(kotlinClassPath)) {
    return buildGradle;
  }

  return buildGradle.replace(
    /dependencies\s?{/,
    `dependencies {
        classpath "${kotlinClassPath}"`
  );
}

const withUnimodulesTestCore = (config) => {
    return withKotlinGradle(config, '1.3.50');
}

module.exports = withUnimodulesTestCore;