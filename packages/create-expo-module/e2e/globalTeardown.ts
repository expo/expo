import fs from 'fs';

export default async function globalTeardown() {
  const registry = (globalThis as any).__createExpoModuleE2eRegistry;
  if (!registry) return;
  await new Promise((resolve) => registry.server.close(resolve));
  fs.rmSync(registry.tarballDir, { recursive: true, force: true });
}
