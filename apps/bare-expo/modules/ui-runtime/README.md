# UI runtime primitive — step 1

The previous list experiment is saved in git stash
`d9f0739848e44a39bf7bbde479c073166831e49c`
(`UI-owned list experiment before primitive step 1`). It includes untracked
files. This is a fresh implementation, not a restoration of that experiment.

## What we are proving first

A JavaScript engine is not a thread. We can create a separate Hermes engine
and execute JavaScript in it on the existing UI/main thread.

Before adding React or a list, establish this contract:

1. The engine is created, used, closed and destroyed on the UI thread.
2. It has its own globals and heap, separate from the app's engine.
3. State persists between evaluations of the same instance.
4. Only copied JSON results leave it, never JSI values or runtime pointers.
5. Script errors are reported; closing prevents subsequent evaluation.

## Read these files in order

### `ios/UIRuntime.h` — the contract

`UIRuntime` owns one engine. Its public operations are `evaluateJSON(source)`
and `close()`. It cannot be copied or moved to another owner.

### `ios/UIRuntime.mm` — the implementation

- `requireUIThread()` rejects calls from another thread with an exception. It
  is active in Release too. It does not dispatch or wait for another thread.
- The constructor calls `hermes::makeHermesRuntime()`. That creates a fresh
  engine, not a reference to the app's runtime.
- `evaluateJavaScript()` executes the source before returning. All temporary
  JSI handles remain on this function's stack, on the owner thread.
- `JSON.stringify()` produces a string that can leave the engine safely.
  Undefined results are rejected, and JS/serialization errors propagate.
- `close()` destroys the engine and is idempotent. The destructor also releases
  the engine on UI; destroying the wrapper off-thread is a fatal ownership bug.

The one installed host function, `__isUIThread()`, is diagnostic. JavaScript
calls it, native checks the current thread, and the test verifies the result.

### `ios/UIRuntimeChecksModule.mm` — the test harness

This RN native module is **not the primitive's public API**. It gives the existing
app a button that can run native checks:

1. Asynchronously visit a background queue and verify construction is rejected.
2. Asynchronously visit the main queue and create the real engines there.
3. Evaluate scripts checking ownership, isolated globals, persistent state,
   independent instances, error recovery, JSON results, close and recreation.
4. Destroy the engines on the same stack before resolving the app's Promise.

`index.ts` places a temporary marker in the app runtime. The UI runtime must not
see that marker. The screen renders the results using the app's existing React
renderer; **no React runs in the new engine yet**.

The asynchronous test entry and synchronous engine evaluation are different
things. The app's Promise can resolve later; native evaluation itself is immediate
once its caller is on the main thread. A busy app JS thread can delay requesting
or displaying the test results. This is not a concurrent-scroll isolation test.

## Run

Install pods and rebuild bare-expo for iOS. Start its development client and
Metro, then select **UI runtime primitive** in the development menu.
Press **Run runtime checks**; all eight checks should pass. Repeating the test
creates and destroys fresh engines each time.

With the simulator and development client already running:

```sh
maestro test apps/bare-expo/e2e/ui-runtime/ownership.ios.yaml
```

The test's menu-button coordinate targets the iPhone 17 Pro Max simulator.

## Deliberately not implemented yet

- A task queue, event-loop integration or timer scheduling.
- ReactInstance, React components, native-module bindings in the new engine.
- Fabric surfaces, mounting, list layout or TextInput.
- Bundling, a `'use ui'` directive, live data updates or application callbacks.
- Android support, frame-rate guarantees or arbitrary-script execution limits.

A long-running script can still block the UI. Thread ownership does not make
arbitrary work fast or preemptible. This development harness is not a general
application-facing eval API.

**Next step:** introduce a small UI-thread execution queue with explicit ordering,
reentrancy and shutdown behavior. Then integrate React, followed by a Fabric
surface. Only after those foundations should the list become a consumer.
