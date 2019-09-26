export default function stripVersionFromPath(path) {
  if (!path) {
    return path;
  }
  return path.replace(/\/versions\/[\w\.]+/, '');
}
