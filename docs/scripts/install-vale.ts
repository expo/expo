import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createWriteStream, existsSync, mkdirSync, chmodSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const DOCS_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VALE_VERSION_FILE = join(DOCS_ROOT, '.vale-version.json');

if (!existsSync(VALE_VERSION_FILE)) {
  console.error(`Vale version file not found: ${VALE_VERSION_FILE}`);
  process.exit(1);
}

const valeVersionData = JSON.parse(readFileSync(VALE_VERSION_FILE, 'utf-8'));
const VALE_VERSION: string = valeVersionData.version;
const VALE_CHECKSUMS: Record<string, string> = valeVersionData.checksums;

if (!VALE_VERSION) {
  console.error(`Vale version not found in: ${VALE_VERSION_FILE}`);
  process.exit(1);
}

if (!VALE_CHECKSUMS || Object.keys(VALE_CHECKSUMS).length === 0) {
  console.error(`Vale checksums not found in: ${VALE_VERSION_FILE}`);
  process.exit(1);
}

const INSTALL_DIR = join(DOCS_ROOT, '.vale', 'bin');
const VALE_BIN = join(INSTALL_DIR, process.platform === 'win32' ? 'vale.exe' : 'vale');

// Skip download if correct version is already installed
if (existsSync(VALE_BIN)) {
  try {
    const output = execSync(`"${VALE_BIN}" --version`, { encoding: 'utf-8' });
    if (output.includes(VALE_VERSION)) {
      console.log(`Vale ${VALE_VERSION} is already installed.`);
      process.exit(0);
    }
  } catch {
    // Binary exists but failed to run, re-download
  }
}

function getPlatform(): { platform: string; ext: string } {
  const os = process.platform;
  const arch = process.arch;

  if (os === 'darwin' && arch === 'arm64') {
    return { platform: 'macOS_arm64', ext: 'tar.gz' };
  }
  if (os === 'darwin' && arch === 'x64') {
    return { platform: 'macOS_64-bit', ext: 'tar.gz' };
  }
  if (os === 'linux' && arch === 'x64') {
    return { platform: 'Linux_64-bit', ext: 'tar.gz' };
  }
  if (os === 'linux' && arch === 'arm64') {
    return { platform: 'Linux_arm64', ext: 'tar.gz' };
  }
  if (os === 'win32' && arch === 'x64') {
    return { platform: 'Windows_64-bit', ext: 'zip' };
  }

  console.error(`Unsupported platform: ${os} ${arch}`);
  process.exit(1);
}

async function downloadToFileAsync(url: string, dest: string): Promise<void> {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }
  await pipeline(Readable.fromWeb(res.body as any), createWriteStream(dest));
}

function verifyChecksum(filePath: string, expectedHash: string): void {
  const fileBuffer = readFileSync(filePath);
  const actualHash = createHash('sha256').update(fileBuffer).digest('hex');

  if (actualHash !== expectedHash) {
    throw new Error(
      `Checksum verification failed.\n  Expected: ${expectedHash}\n  Actual:   ${actualHash}`
    );
  }
}

function extractTarGz(tarballPath: string, destDir: string): void {
  execSync(`tar -xzf "${tarballPath}" -C "${destDir}" vale`, { stdio: 'inherit' });
}

function extractZip(zipPath: string, destDir: string): void {
  if (process.platform === 'win32') {
    execSync(
      `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`,
      {
        stdio: 'inherit',
      }
    );
  } else {
    execSync(`unzip -o "${zipPath}" vale -d "${destDir}"`, { stdio: 'inherit' });
  }
}

async function installValeAsync() {
  const { platform, ext } = getPlatform();
  const expectedHash = VALE_CHECKSUMS[platform];
  if (!expectedHash) {
    throw new Error(
      `No checksum found for platform "${platform}" in ${VALE_VERSION_FILE}. ` +
        `Available platforms: ${Object.keys(VALE_CHECKSUMS).join(', ')}`
    );
  }

  const filename = `vale_${VALE_VERSION}_${platform}.${ext}`;
  const downloadUrl = `https://github.com/vale-cli/vale/releases/download/v${VALE_VERSION}/${filename}`;

  const tmpDir = join(tmpdir(), `vale-install-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });

  try {
    console.log(`Downloading Vale ${VALE_VERSION} for ${platform}...`);
    const archivePath = join(tmpDir, filename);
    await downloadToFileAsync(downloadUrl, archivePath);

    console.log('Verifying checksum...');
    verifyChecksum(archivePath, expectedHash);

    mkdirSync(INSTALL_DIR, { recursive: true });

    if (ext === 'tar.gz') {
      extractTarGz(archivePath, INSTALL_DIR);
    } else {
      extractZip(archivePath, INSTALL_DIR);
    }

    if (process.platform !== 'win32') {
      chmodSync(VALE_BIN, 0o755);
    }

    console.log(`Vale ${VALE_VERSION} installed to ${VALE_BIN}`);
  } finally {
    const { rmSync } = await import('node:fs');
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

installValeAsync().catch(err => {
  console.error(err.message);
  process.exit(1);
});
