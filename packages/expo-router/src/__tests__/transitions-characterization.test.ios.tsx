import { screen, act } from "@testing-library/react-native";
import { use } from "react";
import { Text, View } from "react-native";

import type { SuspenseFallbackProps } from "../exports";
import { Slot } from "../exports";
import { router } from "../imperative-api";
import { renderRouter } from "../testing-library";

/**
 * Step 3 (spike) characterization tests. These pin the *current*, pre-flip behavior so the Step 5
 * transition flip has a baseline to invert.
 *
 * What this stack CAN observe in jest, order-independently (established empirically here):
 *  1. Fallback-present while a pushed screen suspends — the origin screen is unmounted and the
 *     fallback replaces it (today's plain synchronous Suspense commit).
 *  2. Final committed content when the suspending promise resolves within the act that commits the
 *     navigation (the "fallback-absence across an awaited act" shape Step 5's red list will use).
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

describe("suspending navigation — current (pre-transition-flip) behavior", () => {
  it("commits the destination when the suspending promise resolves within the navigation act", async () => {
    // Final-committed-state shape (jest-able per risk 9): resolving the promise within the same act
    // that commits the navigation surfaces the destination, no fallback left. This is the shape
    // Step 5's red list uses for "fallback-absence across an awaited act" once the flip lands.
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

  it("replaces the origin screen with the Suspense fallback while a pushed screen suspends", () => {
    const deferred = createDeferred<string>();
    renderSuspendingApp(deferred.promise);

    expect(screen.getByTestId("index")).toBeVisible();

    act(() => router.push("/detail"));

    // Falsifiable pair: the destination content is NOT on screen, the fallback IS. Today the
    // fallback shows because this is a plain synchronous Suspense commit — nothing wraps the
    // dispatch in `startTransition` yet (that is Step 5). Do not read this as "uSES de-opts";
    // nothing is a transition at this step.
    expect(screen.queryByTestId("slow-content")).toBeNull();
    expect(screen.getByTestId("slow-fallback")).toBeVisible();

    // Pre-flip characterization to pin for Step 5: the origin screen is UNMOUNTED while the
    // destination suspends — the fallback replaces it. Step 5 (Goal 1 part b) inverts this: the
    // previous screen stays mounted, no fallback flashes. Asserting the current (unmounted) state
    // makes the polarity Step 5 flips explicit. The deferred is intentionally left unresolved (the
    // pending window is the point); keeping it the file's last test is a precaution, not required —
    // the two tests are verified order-independent.
    expect(screen.queryByTestId("index")).toBeNull();
  });
});
