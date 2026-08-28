import type { ProjectRouteTable } from '../../project/routes';
import { checkRoute, nearestRoute, routeNotFoundError } from '../routeCheck';

function table(routes: string[], reason: string | null = null): ProjectRouteTable {
  return {
    routerRoot: 'app',
    routes: routes.map((route) => ({ route, file: `app${route}.tsx`, dynamic: /\[/.test(route) })),
    reason,
  };
}

describe(checkRoute, () => {
  const params = { enabled: true, isFullUrl: false };

  it(`should pass a route the project has`, () => {
    expect(checkRoute({ ...params, route: '/notes', table: table(['/', '/notes']) })).toEqual({
      checked: true,
      ok: true,
      matched: '/notes',
      routeCount: 2,
      reason: null,
    });
  });

  it(`should fail a route the project has not got`, () => {
    expect(checkRoute({ ...params, route: '/nope', table: table(['/']) })).toMatchObject({
      checked: true,
      ok: false,
      matched: null,
    });
  });

  // The three keys are one fact: `checked` is `ok != null`, and `reason` is there exactly when
  // `ok` is not. A caller must never have to reconcile them.
  it.each([
    ['--no-route-check', { ...params, enabled: false, route: '/nope', table: table(['/']) }],
    ['a full URL', { ...params, isFullUrl: true, route: 'a://b', table: table(['/']) }],
    ['no router directory', { ...params, route: '/nope', table: table([], 'no app directory') }],
  ])(`should leave the verdict unmade for %s`, (_label, input) => {
    const result = checkRoute(input);
    expect(result.ok).toBeNull();
    expect(result.checked).toBe(false);
    expect(result.matched).toBeNull();
    expect(typeof result.reason).toBe('string');
  });
});

describe(routeNotFoundError, () => {
  it(`should name the router directory it read`, () => {
    const error = routeNotFoundError('/nope', table(['/', '/notes']));
    expect(error.code).toBe('ROUTE_NOT_FOUND');
    expect(error.message).toContain('app');
    expect(error.message).toContain('Unmatched Route');
  });

  it(`should stop listing routes once there are too many to read`, () => {
    const routes = Array.from({ length: 40 }, (_, i) => `/page-${i}`);
    const message = routeNotFoundError('/nope', table(routes)).message;
    expect(message).toContain('and 16 more');
    expect(message).toContain('/page-0');
    expect(message).not.toContain('/page-39');
  });

  it(`should fall back to the root route when nothing is close`, () => {
    expect(routeNotFoundError('/zzzzzzzzzz', table(['/', '/notes'])).suggestedCommand).toBe(
      'npx @expo/agent-cli navigate /'
    );
  });

  // Friction run 5. The `Try:` line is what a driving agent runs next, so it has to be the command
  // the caller was running: a `runtime:reload --route /nope` answered with `navigate /notes`
  // silently drops the reload, which is the whole reason that run was reloading.
  it(`should keep the caller's own command in the suggestion`, () => {
    const error = routeNotFoundError('/note', table(['/', '/notes']), {
      command: 'runtime:reload',
    });

    expect(error.suggestedCommand).toBe('npx @expo/agent-cli runtime:reload --route /notes');
    expect(error.message).toContain('did you mean "/notes"?');
  });

  it(`should keep it for the fallback too`, () => {
    const error = routeNotFoundError('/zzzzzzzzzz', table(['/', '/notes']), {
      command: 'runtime:reload',
    });

    expect(error.suggestedCommand).toBe('npx @expo/agent-cli runtime:reload --route /');
  });
});

describe(nearestRoute, () => {
  it(`should catch a one-character typo`, () => {
    expect(nearestRoute('/note', ['/', '/notes', '/explore'])).toBe('/notes');
    expect(nearestRoute('/notess', ['/', '/notes', '/explore'])).toBe('/notes');
  });

  // A confident wrong guess is worse than no guess: the last line of a failure is what a driving
  // agent runs, so it must not send it somewhere unrelated.
  it(`should offer nothing when the nearest route is not near`, () => {
    expect(nearestRoute('/completely-different', ['/', '/ab'])).toBeNull();
  });

  it(`should answer null for a project with no routes`, () => {
    expect(nearestRoute('/notes', [])).toBeNull();
  });
});

describe('a disabled check names its real reason', () => {
  const table = { routes: [{ pattern: '/', segments: [] }], reason: null } as any;

  it(`should attribute --no-route-check only when nothing else disabled it`, () => {
    const result = checkRoute({ route: '/', table, enabled: false, isFullUrl: false });
    expect(result.reason).toContain('--no-route-check');
  });

  it(`should carry the caller's reason when one is given`, () => {
    const result = checkRoute({
      route: '/',
      table,
      enabled: false,
      disabledReason: 'no --route was named, so there was no route to check',
      isFullUrl: false,
    });
    expect(result.reason).toBe('no --route was named, so there was no route to check');
    expect(result.reason).not.toContain('--no-route-check');
  });
});
