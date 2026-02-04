#!/usr/bin/env node

/**
 * Downloads the production Snack runtime bundle from EAS Updates for iOS.
 *
 * Usage: yarn download-snack-runtime
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SNACK_PROJECT_ID = '933fd9c0-1666-11e7-afca-d980795c5824';
const UPDATE_GROUP_ID = 'c9fb9b03-1a02-471e-b0e0-bcce08392ce1';

const OUTPUT_DIR = path.join(__dirname, '../ios/Exponent/Supporting/SnackRuntime');
const BUNDLE_NAME = 'snack-runtime.hbc';

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        resolve({ status: res.statusCode, headers: res.headers, body });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function parseMultipartManifest(body, contentType) {
  const boundaryMatch = contentType.match(/boundary=([^\s;]+)/);
  if (!boundaryMatch) {
    throw new Error('Could not find boundary in content-type');
  }
  const boundary = boundaryMatch[1];

  const bodyStr = body.toString('utf8');
  const parts = bodyStr.split(`--${boundary}`).filter((p) => p.trim() && p.trim() !== '--');

  const result = {};
  for (const part of parts) {
    const [headerSection, ...contentParts] = part.split('\r\n\r\n');
    const content = contentParts.join('\r\n\r\n').trim();

    const nameMatch = headerSection.match(/name="([^"]+)"/);
    if (nameMatch) {
      const name = nameMatch[1];
      if (headerSection.includes('application/json')) {
        result[name] = JSON.parse(content);
      } else {
        result[name] = content;
      }
    }
  }

  return result;
}

async function downloadSnackRuntime() {
  const platform = 'ios';

  console.log('Fetching Snack runtime manifest...');

  const manifestUrl = `https://u.expo.dev/${SNACK_PROJECT_ID}/group/${UPDATE_GROUP_ID}`;
  const manifestRes = await fetch(manifestUrl, {
    headers: {
      'expo-platform': platform,
      Accept: 'multipart/mixed',
    },
  });

  if (manifestRes.status !== 200) {
    throw new Error(`Failed to fetch manifest: ${manifestRes.status}`);
  }

  const contentType = manifestRes.headers['content-type'];
  const parsed = parseMultipartManifest(manifestRes.body, contentType);

  const manifest = parsed.manifest;
  const extensions = parsed.extensions;

  if (!manifest || !manifest.launchAsset) {
    throw new Error('Invalid manifest: missing launchAsset');
  }

  const launchAsset = manifest.launchAsset;
  const authHeaders = extensions?.assetRequestHeaders?.[launchAsset.key];

  console.log(`Update ID: ${manifest.id}`);
  console.log(`Runtime Version: ${manifest.runtimeVersion}`);
  console.log(`Created: ${manifest.createdAt}`);
  console.log(`Bundle URL: ${launchAsset.url}`);

  // Download the bundle
  console.log(`\nDownloading bundle...`);

  const bundleRes = await fetch(launchAsset.url, {
    headers: authHeaders || {},
  });

  if (bundleRes.status !== 200) {
    throw new Error(`Failed to download bundle: ${bundleRes.status}`);
  }

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const bundlePath = path.join(OUTPUT_DIR, BUNDLE_NAME);
  fs.writeFileSync(bundlePath, bundleRes.body);

  console.log(`Bundle saved to: ${bundlePath}`);
  console.log(`Size: ${(bundleRes.body.length / 1024 / 1024).toFixed(2)} MB`);

  // Update README with version info
  const readmePath = path.join(OUTPUT_DIR, 'README.md');
  const readmeContent = `# Snack Runtime Bundle

This directory contains the pre-embedded Snack runtime JavaScript bundle for offline/faster loading of Snacks in Expo Go.

## Version Information

| Property | Value |
|----------|-------|
| **Update ID** | \`${manifest.id}\` |
| **Update Group ID** | \`${UPDATE_GROUP_ID}\` |
| **Runtime Version** | \`${manifest.runtimeVersion}\` |
| **SDK Version** | \`${manifest.extra?.expoClient?.sdkVersion || 'unknown'}\` |
| **Branch** | \`${manifest.metadata?.branchName || 'production'}\` |
| **Created** | \`${manifest.createdAt}\` |
| **Bundle Format** | Hermes JavaScript bytecode |
| **Bundle Size** | ~${(bundleRes.body.length / 1024 / 1024).toFixed(1)}MB |
| **Downloaded** | \`${new Date().toISOString()}\` |

## How This Bundle Was Downloaded

\`\`\`bash
yarn download-snack-runtime
\`\`\`

Or manually:

\`\`\`bash
# 1. Fetch manifest
curl -s "https://u.expo.dev/${SNACK_PROJECT_ID}/group/${UPDATE_GROUP_ID}" \\
  -H "expo-platform: ios" \\
  -H "Accept: multipart/mixed" > /tmp/snack-manifest.txt

# 2. Parse manifest for launchAsset.url and extensions.assetRequestHeaders
# 3. Download bundle with authorization header
\`\`\`

## How to Enable

Set the UserDefaults key \`ExpoGoUseEmbeddedSnackRuntime\` to \`true\`:

\`\`\`objc
[[NSUserDefaults standardUserDefaults] setBool:YES forKey:@"ExpoGoUseEmbeddedSnackRuntime"];
\`\`\`

## Related Files

- \`EXAppLoaderExpoUpdates.m\` - Contains the loading logic
- \`cp-bundle-resources-conditionally.sh\` - Build phase that copies this folder to app bundle
- \`SettingsManager.swift\` - Swift interface for the flag
`;

  fs.writeFileSync(readmePath, readmeContent);
  console.log(`README updated: ${readmePath}`);

  return { manifest, bundlePath };
}

async function main() {
  try {
    await downloadSnackRuntime();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
