export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }): string {
  console.log('redirectSystemPath', { path, initial });
  try {
    // Handle App Clip default page redirection.
    // If path matches https://appclip.apple.com/id?p=com.evanbacon.pillarvalley.clip (with any query parameters), then redirect to `/` path.
    const url = new URL(path);
    if (url.hostname === 'appclip.apple.com') {
      return '/?ref=' + encodeURIComponent(path);
    }
    return path;
  } catch {
    return path;
  }
}
