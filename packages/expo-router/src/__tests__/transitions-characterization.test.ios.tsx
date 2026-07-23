import { screen, act } from "@testing-library/react-native";
import { use } from "react";
import { Text, View } from "react-native";

import type { SuspenseFallbackProps } from "../exports";
import { Slot } from "../exports";
import { router } from "../imperative-api";
import Stack from "../layouts/StackClient";
import { renderRouter } from "../testing-library";

/**
 * Transition-flip behavior tests (Step 5). Originally Step-3 spike characterizations of the pre-flip
 * synchronous-Suspense behavior; the flip inverts them: a JS-initiated `router.push` is now a
 * `React.startTransition`, so a suspending destination prepares in the background without flashing
 * the fallback.
 *
 * What this stack CAN observe in jest, order-independently (established empirically here):
 *  1. Origin stays mounted with NO fallback while a pushed screen suspends — the transition keeps the
 *     previous screen up (the inversion of the pre-flip synchronous commit that unmounted it).
 *  2. Final committed content when the suspending promise resolves within the act that commits the
 *     navigation (the "fallback-absence across an awaited act" shape the flip guarantees).
 *
 * What it CANNOT observe reliably: the fallback -> content *recovery* when the promise resolves in a
 * *later* act than the one that committed the fallback. In isolation that recovery does not happen —
 * no timer/microtask flush surfaces it (fake timers, real timers, and runAllTimersAsync were all
 * tried). That recovery IS the mid-flight window, and its unobservability here is direct evidence for
 * risk 9's "mid-flight assertions are simulator-only" verdict. We deliberately do NOT assert a
 * mid-flight recovery as an in-file test.
 *
 * Isolation note: the two committed tests are verified order-INDEPENDENT (run in both orders,
 * repeatedly, no flakes). An early one-off observation suggested a *later* separate-act resolve
 * might "recover" a committed fallback when preceded by a test leaving an unresolved suspense
 * (hinting at module-global leakage — `storeRef`/`routingQueue` do persist across renderRouter
 * calls). Three independent controlled re-runs (byte-identical scratch pairs, with/without the
 * dangling test, with/without explicit unmount) could NOT reproduce it: recovery never occurred in
 * any configuration. Treat the leak as a false observation, not a real hazard; keeping suspending
 * tests isolated is cheap hygiene, not a fix for a proven bug. Step 5's red list must assert final
 * committed states (shape 2), never a mid-flight recovery.
 *
 * No product code is exercised beyond what a normal navigation to a suspending screen touches.
 */

/** A test-controlled promise: suspends `use(promise)` until `resolve`/`reject` is called. */
function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// A route component calling React `use(promise)` suspends inside the per-screen React.Suspense
// boundary (useScreens.tsx) regardless of import mode — the import-mode-independent escape hatch for
// the "primary suspending scenario" (risk 9). The lazy-bundle React.lazy path itself is
// characterized in the simulator (steps/Step-3.md, Fixture 2), not here. The fallback is attached at
// a nested layout because expo-router only honors a route's own `SuspenseFallback` export when the
// route is a layout (useScreens.tsx); a leaf route falls through to the default "Bundling..."
// fallback. The layout gives the test a controllable testID, mirroring SuspenseFallback.test.ios.tsx.
function renderSuspendingApp(promise: Promise<string>) {
  function SuspendingRoute() {
    const value = use(promise);
    return <Text testID="slow-content">{value}</Text>;
  }
  function SlowFallback({ route }: SuspenseFallbackProps) {
    return (
      <View testID="slow-fallback">
        <Text>Loading {route}…</Text>
      </View>
    );
  }
  return renderRouter({
    _layout: () => <Slot />,
    index: () => <Text testID="index">Index</Text>,
    "(slow)/_layout": {
      default: () => <Slot />,
      SuspenseFallback: SlowFallback,
    },
    "(slow)/detail": SuspendingRoute,
  });
}

describe("suspending navigation — transition behavior (post-flip)", () => {
  it("commits the destination when the suspending promise resolves within the navigation act", async () => {
    // Final-committed-state shape (jest-able per risk 9): resolving the promise within the same act
    // that commits the navigation surfaces the destination, no fallback left. This is the
    // "fallback-absence across an awaited act" shape the flip guarantees.
    const deferred = createDeferred<string>();
    renderSuspendingApp(deferred.promise);

    expect(screen.getByTestId("index")).toBeVisible();

    await act(async () => {
      router.push("/detail");
      deferred.resolve("done");
    });

    expect(screen.getByTestId("slow-content")).toBeVisible();
    expect(screen.queryByTestId("slow-fallback")).toBeNull();
  });

  it("keeps the origin screen mounted with no fallback flash while a pushed screen suspends", () => {
    const deferred = createDeferred<string>();
    renderSuspendingApp(deferred.promise);

    expect(screen.getByTestId("index")).toBeVisible();

    act(() => router.push("/detail"));

    // The headline transition behavior (Goal 1): a JS-initiated `router.push` to a suspending
    // destination is wrapped in `React.startTransition` and the navigators read the React-state tree,
    // so React prepares the destination in the background — the origin screen stays mounted and
    // interactive and the Suspense fallback never flashes. This is the exact inversion of the Step-3
    // pre-flip characterization (which showed the fallback replacing the unmounted origin).
    expect(screen.getByTestId("index")).toBeVisible();
    expect(screen.queryByTestId("slow-fallback")).toBeNull();
    expect(screen.queryByTestId("slow-content")).toBeNull();

    // Falsifiability note: these three assertions alone would also hold if the push had silently
    // no-op'd. The guard against that false pass is the *sibling* test above — it drives the exact
    // same `router.push('/detail')` to the exact same suspending route and, by resolving in the
    // navigation act, proves the push genuinely reaches `/detail` and renders `slow-content`. So the
    // pair is falsifiable: a broken/dropped push fails the sibling; a fallback-flash regression fails
    // this one. (A cross-act fallback→content recovery is not observable in this jest stack — risk 9
    // — so the pending window itself is asserted only as "origin up, no fallback".)
  });
});

describe("imperative store lags render during a pending transition (D1 same-tick behavior change)", () => {
  it("router.canGoBack() answers for the committed (pre-push) tree within the same tick as the push", () => {
    renderRouter(
      {
        _layout: () => <Stack />,
        index: () => <Text testID="index">Index</Text>,
        detail: () => <Text testID="detail">Detail</Text>,
      },
      { initialUrl: "/" }
    );

    expect(screen.getByTestId("index")).toBeVisible();
    expect(router.canGoBack()).toBe(false);

    // Read `canGoBack()` in the SAME synchronous tick as the push, before the transition commits.
    // Post-flip the imperative store no longer leads render: `router.push` is a transition, and
    // `canGoBack()` reads the last *committed* tree — so it still answers `false` (pre-push) here,
    // where pre-flip it would have answered `true` immediately. NOT wrapped in one `act` around both
    // (that would flush the transition and make this a tautology).
    let sameTickCanGoBack: boolean | undefined;
    act(() => {
      router.push("/detail");
      sameTickCanGoBack = router.canGoBack();
    });
    expect(sameTickCanGoBack).toBe(false);

    // Once committed (the push flushed by the surrounding act), it reflects the pushed stack.
    expect(screen.getByTestId("detail")).toBeVisible();
    expect(router.canGoBack()).toBe(true);
  });
});
