export default function stripVersionFromPath(path: string) {
  if (!path) {
    return path;
  }
  return path.replace(/\/versions\/[\w.]+/, '');
}
