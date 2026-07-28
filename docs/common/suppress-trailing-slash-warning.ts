/**
 * Suppress the dev-mode hydration warning caused by next/link resolving hrefs
 * differently during SSR vs client hydration: trailing slashes are normalized
 * on the client only (`trailingSlash: true`), and hash-only hrefs inherit the
 * current URL's query string on the client (see TableOfContentsLink).
 */

const isDev = process.env.NODE_ENV === 'development';

function isKnownHrefResolutionDiff(client: string, server: string): boolean {
  const strip = (h: string) => h.replace(/\?[^#]*/, '').replace(/\/(?=#|$)/g, '');
  const c = strip(client);
  const s = strip(server);
  if (!client.endsWith('...') && !server.endsWith('...')) {
    return c === s;
  }
  // React truncates long attribute values in the diff, and the client href is
  // longer (its extra slash or inherited query), so the two cuts land at
  // different offsets. Compare the visible common prefix instead.
  const dropEllipsis = (h: string) => (h.endsWith('...') ? h.slice(0, -3) : h);
  const cBase = dropEllipsis(c);
  const sBase = dropEllipsis(s);
  const length = Math.min(cBase.length, sBase.length);
  return length > 0 && cBase.slice(0, length) === sBase.slice(0, length);
}

export function isTrailingSlashHydrationWarning(msg: string): boolean {
  if (!msg.includes('hydrated but some attributes')) {
    return false;
  }
  // The client side of a pair can print as href="..." or as href={"..."}.
  const clientHrefs = [...msg.matchAll(/\+\s+href={?"([^"]*)"/g)].map(m => m[1]);
  const serverHrefs = [...msg.matchAll(/-\s+href={?"([^"]*)"/g)].map(m => m[1]);
  if (clientHrefs.length === 0 || clientHrefs.length !== serverHrefs.length) {
    return false;
  }
  return clientHrefs.every((c, i) => isKnownHrefResolutionDiff(c, serverHrefs[i]));
}

if (isDev && typeof window !== 'undefined') {
  // By the time _app.tsx runs, Next.js has already
  // replaced console.error with nextJsHandleConsoleError (in register()).
  // Suppressing here prevents that handler from calling handleError -> overlay.
  // React 19 splits hydration warnings across multiple console.error args
  // (args[0] is the template, args[1+] contain the tree diff), so we join
  // all args (stringified) before checking for the href diff pattern.
  const wrappedConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    const fullMessage = args.map(a => (typeof a === 'string' ? a : String(a))).join('\n');
    if (isTrailingSlashHydrationWarning(fullMessage)) {
      return;
    }
    wrappedConsoleError.apply(console, args);
  };
}
