import fs from 'fs-extra';
import path from 'path';

export type AndroidPublication = {
  projectName: string;
  groupId: string;
  artifactId: string;
  version: string;
  repository: 'local-maven-repo';
};

export type AndroidPublicationManifest = {
  schemaVersion: 1;
  packageName: string;
  packageVersion: string;
  publications: AndroidPublication[];
};

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid Android publication metadata: ${field} must be a non-empty string`);
  }
  return value;
}

export function createAndroidPublicationManifest(
  packageName: string,
  packageVersion: string,
  projects: { projectName: string; publication: unknown }[]
): AndroidPublicationManifest {
  if (projects.length === 0) {
    throw new Error(`No Android publications are configured for ${packageName}`);
  }

  const publications = projects
    .map(({ projectName, publication: value }, index): AndroidPublication => {
      const field = `android publication ${index}`;
      if (!value || typeof value !== 'object') {
        throw new Error(`Invalid Android publication metadata: ${field} must be an object`);
      }
      const config = value as Record<string, unknown>;
      const publication: AndroidPublication = {
        projectName,
        groupId: requireString(config.groupId, `${field}.groupId`),
        artifactId: requireString(config.artifactId, `${field}.artifactId`),
        version: requireString(config.version ?? packageVersion, `${field}.version`),
        repository: config.repository as AndroidPublication['repository'],
      };
      if (publication.repository !== 'local-maven-repo') {
        throw new Error(
          `Invalid Android publication metadata: ${field}.repository is not package-local`
        );
      }
      if (publication.version !== packageVersion) {
        throw new Error(
          `Android publication ${publication.projectName} has version ${publication.version}, expected ${packageVersion}`
        );
      }
      return publication;
    })
    .sort((a, b) => a.projectName.localeCompare(b.projectName));

  const coordinates = new Set<string>();
  for (const publication of publications) {
    const coordinate = `${publication.groupId}:${publication.artifactId}:${publication.version}`;
    if (coordinates.has(coordinate)) {
      throw new Error(`Duplicate Android publication coordinate: ${coordinate}`);
    }
    coordinates.add(coordinate);
  }

  return { schemaVersion: 1, packageName, packageVersion, publications };
}

export async function validateAndroidPublicationRepositoryAsync(
  repositoryDirectory: string,
  manifest: AndroidPublicationManifest
): Promise<void> {
  const repositoryRoot = path.resolve(repositoryDirectory);
  for (const publication of manifest.publications) {
    const coordinateDirectory = path.resolve(
      repositoryRoot,
      ...publication.groupId.split('.'),
      publication.artifactId,
      publication.version
    );
    if (
      coordinateDirectory !== repositoryRoot &&
      !coordinateDirectory.startsWith(repositoryRoot + path.sep)
    ) {
      throw new Error(`Unsafe Android publication coordinate for ${publication.projectName}`);
    }
    const basename = `${publication.artifactId}-${publication.version}`;
    for (const extension of ['aar', 'pom', 'module']) {
      const artifact = path.join(coordinateDirectory, `${basename}.${extension}`);
      if (!(await fs.pathExists(artifact))) {
        throw new Error(
          `Missing Android publication artifact: ${path.relative(repositoryRoot, artifact)}`
        );
      }
    }
  }
}

export async function removeNondeterministicMavenMetadataAsync(
  repositoryDirectory: string
): Promise<void> {
  const entries = await fs.readdir(repositoryDirectory, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(repositoryDirectory, entry.name);
      if (entry.isDirectory()) {
        await removeNondeterministicMavenMetadataAsync(entryPath);
      } else if (/^maven-metadata\.xml(?:\..+)?$/.test(entry.name)) {
        await fs.remove(entryPath);
      }
    })
  );
}
