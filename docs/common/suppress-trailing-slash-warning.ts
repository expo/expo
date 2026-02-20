/**
 * Suppress the dev-mode hydration warning caused by next/link normalizing
 * trailing slashes differently during SSR vs client hydration.
 * See: next.config.ts `trailingSlash: true` + next/link internal resolveHref.
 *
 * Two interception points are needed because Next.js dev overlay receives errors
 * through two independent parts:
 *   1. console.error  -> nextJsHandleConsoleError -> handleError -> overlay
 *   2. reportError()  -> window "error" event     -> handleError -> overlay
 */

const isDev = process.env.NODE_ENV === 'development';

if (isDev && typeof window !== 'undefined') {
  const isTrailingSlashHydrationWarning = (msg: string): boolean => {
    if (!msg.includes('hydrated but some attributes')) {
      return false;
    }
    const clientHrefs = [...msg.matchAll(/\+\s+href="([^"]*)"/g)].map(m => m[1]);
    const serverHrefs = [...msg.matchAll(/-\s+href="([^"]*)"/g)].map(m => m[1]);
    if (clientHrefs.length === 0 || clientHrefs.length !== serverHrefs.length) {
      return false;
    }
    const strip = (h: string) => h.replace(/\/(?=[#?]|$)/g, '');
    return clientHrefs.every((c, i) => strip(c) === strip(serverHrefs[i]));
  };

  // Part 1: Wrap console.error. By the time _app.tsx runs, Next.js has already
  // replaced console.error with nextJsHandleConsoleError (in register()).
  // Suppressing here prevents that handler from calling handleError -> overlay.
  // React 19 splits hydration warnings across multiple console.error args
  // (args[0] is the template, args[1+] contain the tree diff), so we join
  // all string args before checking for the href diff pattern.
  const wrappedConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    const fullMessage = args.filter((a): a is string => typeof a === 'string').join('\n');
    if (isTrailingSlashHydrationWarning(fullMessage)) {
      return;
    }
    wrappedConsoleError.apply(console, args);
  };

  // Part 2: Intercept the window "error" event dispatched by reportError().
  // The overlay listens in bubble phase; capture phase always runs first.
  window.addEventListener(
    'error',
    (event: ErrorEvent) => {
      const msg: string = event.error?.message ?? '';
      if (msg.includes('hydrated but some attributes')) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    },
    true
  );
}
