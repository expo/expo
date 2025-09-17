#!/usr/bin/env node
const fs = require('fs');

const minKotlinVersion = '2.0.0';
const maxKotlinVersion = '2.2.20';

const groupId = 'com.google.devtools.ksp';
const artifactId = 'symbol-processing-gradle-plugin';
const path = require('path').resolve(
  __dirname,
  '../android/expo-gradle-plugin/expo-autolinking-plugin/src/main/kotlin/expo/modules/plugin/KSPLookup.kt'
);

const numberPerPage = 30;
const githubReleaseUrl = 'https://api.github.com/repos/google/ksp/releases';

async function* fetchKSPReleases() {
  const url = `${githubReleaseUrl}?per_page=${numberPerPage}`;

  let currentPage = 1;
  while (true) {
    const urlWithIndex = `${url}&page=${currentPage}`;
    console.log(`Fetching versions from: ${urlWithIndex}...`);
    const response = await fetch(urlWithIndex);

    if (!response.ok) {
      throw new Error(`HTTP error, status: ${response.status}`);
    }

    const data = await response.json();
    const versions = data
      .map((release) => release.tag_name)
      // Filter out release candidates, beta and milestone versions
      .filter((version) => !/(rc|beta|m1)/i.test(version));

    yield versions;

    currentPage += 1;
  }
}

async function filterByKotinVersion(generator, minKotlinVersion, maxKotlinVersion) {
  let hasMoreData = true;
  const result = [];
  while (hasMoreData) {
    const { value } = await generator.next();
    const versions = value.map((version) => {
      const [kotlinVersion] = version.split('-');
      return { kotlinVersion, version };
    });

    // If the version is lower than the minKotlinVersion, we can stop fetching more data
    hasMoreData = !versions.some(({ kotlinVersion }) => kotlinVersion < minKotlinVersion);

    result.push(
      ...versions.filter(
        ({ kotlinVersion }) =>
          kotlinVersion >= minKotlinVersion && kotlinVersion <= maxKotlinVersion
      )
    );
  }
  return result;
}

// Group versions by kotlinVersion and return the most recent version for each kotlinVersion
function groupByKotlinVersion(versions) {
  const mostRecentVersions = {};

  // Fill the mostRecentVersions object with the newest version of each kotlinVersion
  versions.forEach(({ kotlinVersion, version }) => {
    if (!mostRecentVersions[kotlinVersion] || mostRecentVersions[kotlinVersion] < version) {
      mostRecentVersions[kotlinVersion] = version;
    }
  });

  // Convert the results object back into an array
  return Object.entries(mostRecentVersions).map(([kotlinVersion, version]) => ({
    kotlinVersion,
    version,
  }));
}

async function generateKSPLookup() {
  const versionsGenerator = fetchKSPReleases(groupId, artifactId, minKotlinVersion);
  const versions = groupByKotlinVersion(
    await filterByKotinVersion(versionsGenerator, minKotlinVersion, maxKotlinVersion)
  );

  console.log(`Found stable versions for ${groupId}:${artifactId}:`);
  for (const { kotlinVersion, version } of versions) {
    console.log(` ${kotlinVersion} => ${version}`);
  }

  console.log('Genereating KSP lookup file...');
  const fileContent = `// Copyright 2015-present 650 Industries. All rights reserved.
// Generated using './scripts/generateKSPLookUp.js'
package expo.modules.plugin

val KSPLookup = mapOf(
${versions.map(({ kotlinVersion, version }) => `  "${kotlinVersion}" to "${version}"`).join(',\n')}
)
`;
  fs.writeFileSync(path, fileContent, 'utf-8');
}

generateKSPLookup();
