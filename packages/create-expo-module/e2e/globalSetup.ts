import spawnAsync from '@expo/spawn-async';
import crypto from 'crypto';
import fs from 'fs';
import http from 'http';
import type { AddressInfo } from 'net';
import os from 'os';
import path from 'path';

const UPSTREAM_REGISTRY = 'https://registry.npmjs.org';

// Workspace packages that generated modules install from this commit instead of npm. The module
// template ships with the same commit's packages, and the published `jest-expo` declares a peer
// range on `@react-native/jest-preset` that the template's React Native version can be ahead of.
const WORKSPACE_PACKAGES = ['jest-expo'];

export default async function globalSetup() {
  const tarballDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-expo-module-e2e-registry-'));
  const packuments = new Map<string, object>();
  const tarballs = new Map<string, string>();

  const server = http.createServer((req, res) => {
    const url = req.url ?? '/';
    const packument = packuments.get(decodeURIComponent(url.slice(1)));
    if (packument) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(packument));
      return;
    }
    const tarball = tarballs.get(url);
    if (tarball) {
      res.writeHead(200, { 'content-type': 'application/octet-stream' });
      fs.createReadStream(tarball).pipe(res);
      return;
    }
    res.writeHead(307, { location: UPSTREAM_REGISTRY + url });
    res.end();
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const registryUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  for (const name of WORKSPACE_PACKAGES) {
    const packageDir = path.resolve(__dirname, '../..', name);
    await spawnAsync('pnpm', ['pack', '--pack-destination', tarballDir], { cwd: packageDir });
    const manifest = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
    const tarballPath = path.join(tarballDir, `${name}-${manifest.version}.tgz`);
    const { stdout } = await spawnAsync('tar', ['-xzOf', tarballPath, 'package/package.json']);
    const packedManifest = JSON.parse(stdout);
    const tarballUrlPath = `/${name}/-/${name}-${manifest.version}.tgz`;
    const integrity =
      'sha512-' + crypto.createHash('sha512').update(fs.readFileSync(tarballPath)).digest('base64');

    tarballs.set(tarballUrlPath, tarballPath);
    packuments.set(name, {
      name,
      'dist-tags': { latest: manifest.version },
      versions: {
        [manifest.version]: {
          ...packedManifest,
          dist: { tarball: registryUrl + tarballUrlPath, integrity },
        },
      },
    });
  }

  process.env.npm_config_registry = registryUrl;
  (globalThis as any).__createExpoModuleE2eRegistry = { server, tarballDir };
}
