# UI runtime primitive — steps 1 and 2

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

With the simulator and development client already running, open this app's dev
menu, then run:

```sh
maestro test apps/bare-expo/e2e/ui-runtime/ownership.ios.yaml
```

If the dev-menu button is hidden, relaunch the app with a temporary preference
override before the ownership flow (saved preferences are not changed):

```sh
xcrun simctl launch --terminate-running-process booted dev.expo.Payments -EXDevMenuShowsAtLaunch YES
```

The ownership flow selects the screen from the open dev menu. This avoids
fixed-coordinate taps and URL schemes that another installed BareExpo might claim.
If an Android emulator is also running, pass `--device <ios-simulator-udid>`
before `test` so Maestro selects the iPhone explicitly.

## Step 2: UI execution queue

`ios/UIExecutionQueue.h` and `.mm` add execution policy without owning Hermes.
This separation allows the same queue to be used with a different runtime later.
The queue is created, accessed and destroyed on UI only. Background callers must
first dispatch asynchronously to UI, as the diagnostic bridge does. There are no
cross-thread waits, locks, or background accesses to the engine.

Two operations intentionally have different ordering rules:

```cpp
queue.schedule(updateA);  // Deferred, even when called on UI.
queue.schedule(updateB);  // After A.
queue.runNow(render);    // Immediately, BEFORE the pending A and B.
```

- `schedule` is FIFO. If A schedules C, the deferred order is A, B, C.
- `runNow` is the eventual native-demand entry point. It does not flush pending
  updates first. It observes already-applied state, not future queued updates.
  A later data/surface adapter must define which data version native renders.
- Recursive `runNow` on the same queue is rejected, including from a queued job.
  Schedule follow-up work instead. This guard is not a global React guard across
  different queues; a renderer will need one shared execution boundary.
- Immediate errors propagate to the caller. Deferred C++/JS errors reach the
  required UI-thread error handler, and later jobs continue. That handler must
  not throw. This is not a recovery mechanism for native crashes.
- Each dispatch executes one job, then posts the next. Other main-queue work can
  interleave. This is not frame pacing, a time budget, or preemption: GCD can still
  execute multiple jobs within one frame, and one expensive job can block UI.
- `close` is idempotent, drops pending jobs and rejects new work. It does not
  interrupt an active job, destroy Hermes, or unmount anything. Pending jobs do
  not receive completion callbacks. The current job can return normally.
- Destruction closes the queue. Posted callbacks retain private state rather
  than a pointer to the wrapper, so they safely become no-ops after closing.
  Do not retain the queue indefinitely in its own error handler; use weak captures.

Read `ios/UIExecutionQueueChecksModule.mm` to see these rules exercised with the
real step-1 Hermes runtime. The test checks immediate execution, asynchronous
FIFO ordering, nested scheduling, priority, reentrancy, errors, interleaving,
closing from an active job, and destruction with a callback already posted.
Runtime disposal happens after the final job returns.

On the diagnostic screen press **Run queue checks**. All eight checks should pass.
After the ownership flow, or after opening the diagnostic screen manually, run:

```sh
maestro test apps/bare-expo/e2e/ui-runtime/queue.ios.yaml
```

## Deliberately not implemented yet

- A JavaScript event loop, microtask/timer integration or frame-aware scheduling.
- ReactInstance, React components, native-module bindings in the new engine.
- Fabric surfaces, mounting, list layout or TextInput.
- Bundling, a `'use ui'` directive, live data updates or application callbacks.
- Android support, frame-rate guarantees or arbitrary-script execution limits.

A long-running script can still block the UI. Thread ownership does not make
arbitrary work fast or preemptible. This development harness is not a general
application-facing eval API.

**Next step:** bootstrap React and its scheduler in the UI runtime and prove a
small component can render and update state. Then connect a Fabric surface.
Only after those foundations should the list become a consumer.
