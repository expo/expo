export default function getExperienceIdFromManifest(manifest: { [key: string]: string } | null) {
  if (!manifest) {
    return null;
  }
  return manifest.scopeKey ?? manifest.id;
}
