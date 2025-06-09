#!/usr/bin/env node
const fs = require('fs');

const minKotlinVersion = '2.0.0';
const maxKotlinVersion = '2.1.20';

const groupId = 'com.google.devtools.ksp';
const artifactId = 'symbol-processing-gradle-plugin';
const path = require('path').resolve(
  __dirname,
  '../android/expo-gradle-plugin/expo-autolinking-plugin/src/main/kotlin/expo/modules/plugin/KSPLookup.kt'
);

const mavenRows = 30;
const mavenSearchUrl = 'https://search.maven.org/solrsearch/select';

async function* fetchMavenVersions(groupId, artifactId) {
  const query = `g:"${groupId}" AND a:"${artifactId}"`;

  const url = `${mavenSearchUrl}?q=${encodeURIComponent(query)}&core=gav&rows=${mavenRows}&wt=json`;

  let currentIndex = 0;
  while (true) {
    const response = await fetch(`${url}&start=${currentIndex}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const versions = data.response.docs
      .map((doc) => doc.v)
      // Filter out release candidates, beta and milestone versions
      .filter((version) => !/(rc|beta|m1)/i.test(version));

    yield versions;

    currentIndex += mavenRows;
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
  const versionsGenerator = fetchMavenVersions(groupId, artifactId, minKotlinVersion);
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
