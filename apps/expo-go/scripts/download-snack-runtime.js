#!/usr/bin/env node

/**
 * Downloads or builds the Snack runtime bundle and assets for embedding in Expo Go (iOS).
 *
 * Usage:
 *   yarn download-snack-runtime                    # Download from EAS Updates (production)
 *   yarn download-snack-runtime ~/code/snack/runtime  # Build from local source
 *
 * This produces:
 * - The Hermes bytecode bundle (snack-runtime.hbc)
 * - All assets (fonts, images) into assets/ subdirectory
 * - manifest.json with embedded asset path mappings
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SNACK_PROJECT_ID = '933fd9c0-1666-11e7-afca-d980795c5824';
const UPDATE_GROUP_ID = 'c9fb9b03-1a02-471e-b0e0-bcce08392ce1';

const OUTPUT_DIR = path.join(__dirname, '../ios/Exponent/Supporting/SnackRuntime');
const ASSETS_DIR = path.join(OUTPUT_DIR, 'assets');
const BUNDLE_NAME = 'snack-runtime.hbc';

const EXT_TO_CONTENT_TYPE = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ttf: 'font/ttf',
  otf: 'font/otf',
  woff: 'font/woff',
  woff2: 'font/woff2',
};

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

async function downloadAsset(asset, authHeaders, index, total) {
  const ext = asset.fileExtension.replace('.', '');
  const filename = `${asset.key}.${ext}`;
  const assetPath = path.join(ASSETS_DIR, filename);

  // Skip if already exists
  if (fs.existsSync(assetPath)) {
    const stats = fs.statSync(assetPath);
    console.log(
      `  [${index + 1}/${total}] Skipping ${filename} (already exists, ${formatSize(stats.size)})`
    );
    return { filename, size: stats.size, skipped: true };
  }

  const headers = authHeaders?.[asset.key] || {};
  const res = await fetch(asset.url, { headers });

  if (res.status !== 200) {
    throw new Error(`Failed to download asset ${asset.key}: ${res.status}`);
  }

  fs.writeFileSync(assetPath, res.body);
  console.log(
    `  [${index + 1}/${total}] Downloaded ${filename} (${formatSize(res.body.length)})`
  );

  return { filename, size: res.body.length, skipped: false };
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ---------------------------------------------------------------------------
// Local build: export from a local snack runtime directory
// ---------------------------------------------------------------------------

async function buildLocalSnackRuntime(runtimeDir) {
  const resolvedDir = path.resolve(runtimeDir);

  if (!fs.existsSync(resolvedDir)) {
    throw new Error(`Directory does not exist: ${resolvedDir}`);
  }
  if (!fs.existsSync(path.join(resolvedDir, 'package.json'))) {
    throw new Error(`Not a valid project directory (no package.json): ${resolvedDir}`);
  }

  const exportDir = path.join(resolvedDir, '.expo-go-export');

  // 1. Install dependencies
  console.log(`Installing dependencies in ${resolvedDir}...`);
  execSync('yarn install', { cwd: resolvedDir, stdio: 'inherit' });

  // 2. Export the iOS bundle
  console.log(`\nExporting iOS bundle...`);
  execSync(`npx expo export --platform ios --output-dir "${exportDir}"`, {
    cwd: resolvedDir,
    stdio: 'inherit',
    env: { ...process.env, EXPO_PUBLIC_SNACK_ENV: 'production' },
  });

  // 3. Find the .hbc bundle
  const jsDir = path.join(exportDir, '_expo/static/js/ios');
  const hbcFiles = fs.readdirSync(jsDir).filter((f) => f.endsWith('.hbc'));
  if (hbcFiles.length === 0) {
    throw new Error(`No .hbc bundle found in ${jsDir}`);
  }
  const hbcFile = hbcFiles[0];
  console.log(`\nFound bundle: ${hbcFile}`);

  // 4. Read export metadata
  const metadata = JSON.parse(
    fs.readFileSync(path.join(exportDir, 'metadata.json'), 'utf8')
  );
  const assetEntries = metadata.fileMetadata.ios.assets;

  // 5. Read app.json/app.config for manifest metadata
  let appConfig = {};
  const appJsonPath = path.join(resolvedDir, 'app.json');
  if (fs.existsSync(appJsonPath)) {
    const raw = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    appConfig = raw.expo || raw;
  }

  // 6. Clear and recreate output directory
  console.log(`\nCopying to ${OUTPUT_DIR}...`);
  if (fs.existsSync(ASSETS_DIR)) {
    fs.rmSync(ASSETS_DIR, { recursive: true });
  }
  fs.mkdirSync(ASSETS_DIR, { recursive: true });

  // 7. Copy the bundle
  const srcBundle = path.join(jsDir, hbcFile);
  const dstBundle = path.join(OUTPUT_DIR, BUNDLE_NAME);
  fs.copyFileSync(srcBundle, dstBundle);
  const bundleSize = fs.statSync(dstBundle).size;
  console.log(`  Copied ${BUNDLE_NAME} (${formatSize(bundleSize)})`);

  // 8. Copy assets with extensions
  const seenFiles = new Set();
  let totalAssetsSize = 0;

  for (const entry of assetEntries) {
    const key = path.basename(entry.path);
    const ext = entry.ext;
    const filename = `${key}.${ext}`;

    if (seenFiles.has(filename)) continue;
    seenFiles.add(filename);

    const srcAsset = path.join(exportDir, entry.path);
    const dstAsset = path.join(ASSETS_DIR, filename);

    if (fs.existsSync(srcAsset)) {
      fs.copyFileSync(srcAsset, dstAsset);
      totalAssetsSize += fs.statSync(dstAsset).size;
    }
  }

  console.log(`  Copied ${seenFiles.size} assets (${formatSize(totalAssetsSize)})`);

  // 9. Generate manifest
  const embeddedManifest = {
    id: `local-${Date.now()}`,
    createdAt: new Date().toISOString(),
    runtimeVersion: `exposdk:${appConfig.sdkVersion || 'unknown'}`,
    metadata: {
      source: 'local-build',
      sourceDir: resolvedDir,
    },
    extra: {
      expoClient: {
        name: appConfig.name || 'Snack',
        slug: appConfig.slug || 'snack',
        owner: appConfig.owner || 'exponent',
        sdkVersion: appConfig.sdkVersion,
        platforms: appConfig.platforms,
        runtimeVersion: appConfig.runtimeVersion,
      },
    },
    bundleUrl: `file://SnackRuntime/${BUNDLE_NAME}`,
    launchAsset: {
      key: 'local-bundle',
      contentType: 'application/javascript',
      url: `file://SnackRuntime/${BUNDLE_NAME}`,
      nsBundleDir: 'SnackRuntime',
      nsBundleFilename: 'snack-runtime',
      type: 'hbc',
    },
    assets: assetEntries.map((entry) => {
      const key = path.basename(entry.path);
      const ext = entry.ext;
      const contentType = EXT_TO_CONTENT_TYPE[ext] || `application/${ext}`;
      return {
        key,
        contentType,
        nsBundleDir: 'SnackRuntime/assets',
        nsBundleFilename: key,
        type: ext,
      };
    }),
  };

  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(embeddedManifest, null, 2) + '\n');
  console.log(`  Saved manifest.json`);

  // 10. Clean up export directory
  fs.rmSync(exportDir, { recursive: true });
  console.log(`  Cleaned up export directory`);

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Summary (local build):`);
  console.log(`  Source:  ${resolvedDir}`);
  console.log(`  Bundle:  ${formatSize(bundleSize)}`);
  console.log(`  Assets:  ${seenFiles.size} files (${formatSize(totalAssetsSize)})`);
  console.log(`  Total:   ${formatSize(bundleSize + totalAssetsSize)}`);
  console.log(`${'='.repeat(50)}`);
}

// ---------------------------------------------------------------------------
// Remote download: fetch from EAS Updates
// ---------------------------------------------------------------------------

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
  const assets = manifest.assets || [];
  const authHeaders = extensions?.assetRequestHeaders;

  console.log(`\nUpdate ID: ${manifest.id}`);
  console.log(`Runtime Version: ${manifest.runtimeVersion}`);
  console.log(`Created: ${manifest.createdAt}`);
  console.log(`Assets: ${assets.length} files`);

  // Ensure output directories exist
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(ASSETS_DIR, { recursive: true });

  // Download the bundle
  console.log(`\nDownloading JS bundle...`);
  const bundlePath = path.join(OUTPUT_DIR, BUNDLE_NAME);
  let bundleSize;

  if (fs.existsSync(bundlePath)) {
    bundleSize = fs.statSync(bundlePath).size;
    console.log(`  Skipping ${BUNDLE_NAME} (already exists, ${formatSize(bundleSize)})`);
  } else {
    const bundleHeaders = authHeaders?.[launchAsset.key] || {};
    const bundleRes = await fetch(launchAsset.url, { headers: bundleHeaders });

    if (bundleRes.status !== 200) {
      throw new Error(`Failed to download bundle: ${bundleRes.status}`);
    }

    fs.writeFileSync(bundlePath, bundleRes.body);
    bundleSize = bundleRes.body.length;
    console.log(`  Downloaded ${BUNDLE_NAME} (${formatSize(bundleSize)})`);
  }

  // Download all assets
  console.log(`\nDownloading ${assets.length} assets...`);

  let totalAssetsSize = 0;
  let downloadedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < assets.length; i++) {
    const result = await downloadAsset(assets[i], authHeaders, i, assets.length);
    totalAssetsSize += result.size;
    if (result.skipped) {
      skippedCount++;
    } else {
      downloadedCount++;
    }
  }

  // Generate embedded manifest
  console.log(`\nGenerating embedded manifest...`);

  const embeddedManifest = {
    id: manifest.id,
    createdAt: manifest.createdAt,
    runtimeVersion: manifest.runtimeVersion,
    metadata: manifest.metadata,
    extra: manifest.extra,
    // Bundle URL pointing to embedded file
    bundleUrl: `file://SnackRuntime/${BUNDLE_NAME}`,
    // Launch asset with embedded path info
    launchAsset: {
      key: launchAsset.key,
      hash: launchAsset.hash,
      contentType: launchAsset.contentType,
      // url is required by ExpoUpdatesManifest.bundleUrl() - will be replaced with file:// path at runtime
      url: 'file://SnackRuntime/snack-runtime.hbc',
      // For embedded loading
      nsBundleDir: 'SnackRuntime',
      nsBundleFilename: 'snack-runtime',
      type: 'hbc',
    },
    // Assets with embedded path info
    assets: assets.map((asset) => {
      const ext = asset.fileExtension.replace('.', '');
      return {
        key: asset.key,
        hash: asset.hash,
        contentType: asset.contentType,
        // For embedded loading
        nsBundleDir: 'SnackRuntime/assets',
        nsBundleFilename: asset.key,
        type: ext,
      };
    }),
  };

  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(embeddedManifest, null, 2));
  console.log(`  Saved manifest.json`);

  // Update README
  const readmePath = path.join(OUTPUT_DIR, 'README.md');
  const readmeContent = `# Snack Runtime Bundle

This directory contains the pre-embedded Snack runtime for offline/faster loading of Snacks in Expo Go.

## Contents

| File | Description | Size |
|------|-------------|------|
| \`snack-runtime.hbc\` | Hermes bytecode bundle | ${formatSize(bundleSize)} |
| \`manifest.json\` | Embedded manifest with asset mappings | - |
| \`assets/\` | ${assets.length} assets (fonts, images) | ${formatSize(totalAssetsSize)} |

**Total size: ${formatSize(bundleSize + totalAssetsSize)}**

## Version Information

| Property | Value |
|----------|-------|
| **Update ID** | \`${manifest.id}\` |
| **Update Group ID** | \`${UPDATE_GROUP_ID}\` |
| **Runtime Version** | \`${manifest.runtimeVersion}\` |
| **SDK Version** | \`${manifest.extra?.expoClient?.sdkVersion || 'unknown'}\` |
| **Branch** | \`${manifest.metadata?.branchName || 'production'}\` |
| **Created** | \`${manifest.createdAt}\` |
| **Downloaded** | \`${new Date().toISOString()}\` |

## How to Update

\`\`\`bash
# Re-download from EAS Updates (skips existing files)
yarn download-snack-runtime

# Build from local snack runtime source
yarn download-snack-runtime ~/code/snack/runtime

# Force re-download by removing the directory first
rm -rf ios/Exponent/Supporting/SnackRuntime
yarn download-snack-runtime
\`\`\`

## How to Enable

Set \`USE_EMBEDDED_SNACK_RUNTIME\` to \`true\` in \`EXBuildConstants.plist\`.

## Related Files

- \`EXAppLoaderExpoUpdates.m\` - Loading logic for embedded runtime
- \`cp-bundle-resources-conditionally.sh\` - Build phase that copies this folder
`;

  fs.writeFileSync(readmePath, readmeContent);
  console.log(`  Updated README.md`);

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Summary:`);
  console.log(`  Bundle: ${formatSize(bundleSize)}`);
  console.log(`  Assets: ${assets.length} files (${formatSize(totalAssetsSize)})`);
  console.log(`  Total:  ${formatSize(bundleSize + totalAssetsSize)}`);
  console.log(`  Downloaded: ${downloadedCount}, Skipped: ${skippedCount}`);
  console.log(`${'='.repeat(50)}`);

  return { manifest: embeddedManifest, bundlePath };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const localPath = process.argv[2];

  try {
    if (localPath) {
      console.log(`Building snack runtime from local source: ${localPath}\n`);
      await buildLocalSnackRuntime(localPath);
    } else {
      await downloadSnackRuntime();
    }
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
