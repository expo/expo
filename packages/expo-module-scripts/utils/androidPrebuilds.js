import fs from 'node:fs';
import path from 'node:path';

const OUTPUT = '.expo-prebuild-android';

function readManifest(packageRoot) {
  const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  if (!packageJson.scripts?.['precompile-android']) {
    return null;
  }
  const manifestPath = path.join(packageRoot, OUTPUT, 'publication.json');
  if (!fs.statSync(manifestPath, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`Android publication manifest is missing: ${manifestPath}`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (
    manifest.schemaVersion !== 1 ||
    manifest.packageName !== packageJson.name ||
    manifest.packageVersion !== packageJson.version ||
    !Array.isArray(manifest.publications) ||
    manifest.publications.length === 0
  ) {
    throw new Error(
      `Android publication manifest does not match ${packageJson.name}@${packageJson.version}`
    );
  }
  return manifest;
}

export function validateRawAndroidPrebuilds(packageRoot = process.cwd()) {
  const manifest = readManifest(packageRoot);
  if (!manifest) return false;
  const config = JSON.parse(
    fs.readFileSync(path.join(packageRoot, 'expo-module.config.json'), 'utf8')
  );
  const repositoryRoot = path.resolve(packageRoot, OUTPUT, 'local-maven-repo');
  const coordinates = new Set();
  for (const publication of manifest.publications) {
    const coordinate = `${publication.groupId}:${publication.artifactId}:${publication.version}`;
    if (coordinates.has(coordinate))
      throw new Error(`Duplicate Android publication: ${coordinate}`);
    coordinates.add(coordinate);
    if (
      publication.version !== manifest.packageVersion ||
      publication.repository !== 'local-maven-repo'
    ) {
      throw new Error(`Invalid Android publication: ${coordinate}`);
    }
    const configuredProject = config.android?.projects?.find(
      (project) => project.name === publication.projectName
    );
    const configuredPublication = configuredProject?.publication ?? config.android?.publication;
    if (
      configuredPublication?.groupId !== publication.groupId ||
      configuredPublication?.artifactId !== publication.artifactId ||
      (configuredPublication?.version != null &&
        configuredPublication.version !== publication.version) ||
      configuredPublication?.repository !== publication.repository
    ) {
      throw new Error(`Committed Android publication configuration does not match ${coordinate}`);
    }
    const directory = path.resolve(
      repositoryRoot,
      ...publication.groupId.split('.'),
      publication.artifactId,
      publication.version
    );
    if (!directory.startsWith(repositoryRoot + path.sep)) {
      throw new Error(`Unsafe Android publication path: ${coordinate}`);
    }
    const basename = `${publication.artifactId}-${publication.version}`;
    for (const extension of ['aar', 'pom', 'module']) {
      const artifact = path.join(directory, `${basename}.${extension}`);
      if (!fs.statSync(artifact, { throwIfNoEntry: false })?.isFile()) {
        throw new Error(`Android publication artifact is missing: ${artifact}`);
      }
    }
  }
  return true;
}

export function stageAndroidPrebuilds(packageRoot = process.cwd()) {
  const manifest = readManifest(packageRoot);
  if (!manifest) return false;
  validateRawAndroidPrebuilds(packageRoot);

  const repositoryDestination = path.join(packageRoot, 'local-maven-repo');
  fs.rmSync(repositoryDestination, { recursive: true, force: true });
  fs.cpSync(path.join(packageRoot, OUTPUT, 'local-maven-repo'), repositoryDestination, {
    recursive: true,
  });
  return true;
}
