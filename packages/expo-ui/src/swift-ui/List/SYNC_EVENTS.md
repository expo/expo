# SwiftUI List: synchronous-event experiment

## Direction

Extend the existing `ios/ListView.swift` with windowed React content, using the
app's existing React tree and runtime. No extra renderer, runtime, row surface,
native template, or hydration/adoption mechanism. The original children-based
`<List>{children}</List>` API still works as before.

## API

```tsx
// Keep callbacks stable; use useCallback when they depend on component values.
const keyExtractor = (message: Message) => message.id;
const renderItem = ({ item }: { item: Message }) => <MessageRow message={item} />;

<List
  data={messages}
  keyExtractor={keyExtractor}
  renderItem={renderItem}
  estimatedRowHeight={100}
  initialNumToRender={10}
  overscanCount={10}
  extraData={selectedMessageId}
/>
```

This is still experimental. Props for the data path:

- `data`: immutable item array. Use stable unique string keys.
- `renderItem({ item, index })`: normal React content.
- `estimatedRowHeight` (64): fallback content height, excluding native row insets.
  Actual content uses SwiftUI layout, not a forced estimate.
- `initialNumToRender` (10): render and keep the first N current items mounted
  for quick returns to the top. Set 0 to allow every row to be evicted.
- `overscanCount` (10): retain/prefetch this many items on each side of appearing
  rows. It is measured in rows, unlike RN's screen-length-based `windowSize`.
- `extraData`: an immutable invalidation marker forwarded to memoized row wrappers.
  It does not rebuild the key lookup. Your renderer must still read current values;
  this prop cannot repair a stale closure.

The initial-batch and external-data marker semantics take reference from
[React Native VirtualizedList](https://reactnative.dev/docs/virtualizedlist).
Selection, sections, and editing remain on the original children API for now.
Pagination, imperative scrolling, and precise viewability callbacks are not implemented.

## Step 1: the event bridge

`EventDispatcher.experimentalRequestSynchronous(payload)` forwards a SwiftUI view
event through its Objective-C view to `ExpoViewEventEmitter`. The emitter enqueues a
discrete event inside RN's `experimental_flushSync`, requesting a synchronous beat.

The Swift call does not wait for React completion. When RN services the beat, it
coordinates access to the existing JS runtime and can execute urgent work on UI.
Waiting for busy JS and rendering can stall UI. Other queued events can be processed
too; this is not an isolated lane for one row. `onEventSent` observes dispatch, not
completion. There is no SwiftUI presentation barrier or zero-blank guarantee here.

Ordinary events remain asynchronous. Hosted SwiftUI views and both development and
production virtual views are wired through `SwiftUIViewDefinition.swift` and
`SwiftUIViewProps.swift`, with weak references to the native view.

## Step 2: keyed React content

Read `src/swift-ui/List/index.tsx`:

1. `List` selects the data or original children path. It does not stringify keys
   or reset the list when data changes.
2. `DataList` builds native keys and a key-to-item/index map in one memoized pass,
   only when `data` or `keyExtractor` changes.
3. React enumerates only mounted keys. `MemoizedListItem` skips unchanged item,
   index, renderer, and extraData props; React state/context still update normally.
4. Each rendered item is wrapped in `ListItemNativeView(rowKey)`. This is just a
   key carrier in the same React tree.
5. Native `ListView.mountedContent` matches those sparse children to keys via
   Expo UI's existing wrapper protocol. SwiftUI `ForEach` owns display order, so
   React children can remain in request order.

When data or buffer settings change, `DataList` conditionally adjusts its own state
before committing. Surviving active keys keep identity; deleted keys are removed.
There is no effect-delayed cleanup or full-list remount. Unchanged item objects and
stable callbacks let memoization skip work; changed callbacks are always respected.

## Step 3: buffered window and eviction

Read `ListRenderWindow` at the bottom of `ios/ListView.swift`:

1. A native row's `onAppear` adds its key to the appeared set. If content is missing,
   send an urgent `onRequestItem({ key, keys, revision })`, including the current
   appeared-key snapshot. JS retains already-mounted content inside its buffered
   window and mounts missing active content without a transition. It does not
   synchronously mount missing buffer rows. Trimming old content here also prevents
   growth across a long fling if background window work is starved.
2. `onDisappear` removes the key from the appeared set. It does not directly remove
   React children.
3. Native coalesces appearance/disappearance changes into an ordinary
   `onRenderWindowChange({ keys, revision })` event on the next main-queue turn.
4. JS handles that event in `startTransition`. `renderWindowKeys` forms the union of
   active rows' neighboring ranges plus the pinned initial batch. React mounts
   missing buffered content and unmounts content outside that set.
5. Distant active keys produce separate small ranges, not one huge min-to-max range.
   This avoids filling the entire gap during a rapid jump.

### Why revisions matter

Every native urgent/window event gets a monotonically increasing revision. Suppose
a transition wants to evict row A at revision 5, then row A appears and sends an
urgent request at revision 6. React may apply the urgent update before finishing the
older transition. The state updater checks the revision when applied/rebased, so
revision 5 cannot undo revision 6. Even an already-mounted urgent row advances the
revision. A later window snapshot can evict it normally once it is no longer needed.

Native also requests missing content if an appeared row loses its React child after
a delayed commit. Revisions protect JS ordering; this recovery handles the separate
native commit/lifecycle timing boundary. Neither eliminates all possible blank frames.

### Height retention

The actual content reports its measured height through `onGeometryChange`. Native
stores the last positive height by row key together with the list width. When React
evicts that row, its placeholder uses that measurement instead of collapsing.

A changed list width makes old measurements inapplicable until remeasured. The width
is included in the measurement callback value so mounted content refreshes its cache
even if its height stays the same. Deleted keys' measurements are pruned when the JS
data version changes, not by scanning all keys during each scroll update.

These are last-known sizes, not promises: hidden content/data or typography changes
can make a cached height stale until remount/layout. Scroll anchoring under such
changes and RNHostView measurement still need dedicated validation.

## State and performance limits

- Row-local React state is lost on eviction. Persist important item state in the
  data or an external store. Initial pinned rows are the deliberate exception.
- SwiftUI appearance is not pixel-accurate viewability. The buffer is relative to
  lifecycle-active rows, which may include SwiftUI's own preparation region.
- React content is limited to the reported active set, buffer, and initial batch
  by both urgent and background updates. Native commit lag still exists, and the
  lifecycle-active set is controlled by SwiftUI rather than a fixed numeric cap.
- Dataset indexing is O(N) on input changes. Demand work uses mounted/active keys,
  not all data. Neighbor calculation visits at most activeCount × (2 × overscan + 1)
  positions, plus the initial batch, and deduplicates keys. It is not O(1) overall.
- Native row keys and last-known height metadata can still consume O(N) memory;
  bounded React/native content is not constant total metadata storage.
- The urgent path can stall UI. Fast flings and JS stalls still require release
  profiling; this is not yet a shipping-quality or zero-blank claim.

## Verification

JS tests cover keyed identity, structural edits, memoization, 10,000-item demand
operation counts, buffered eviction/state loss, pinned initial rows, empty windows,
disjoint windows, changing buffer props, extraData, and transition/urgent ordering.

Playground uses 200 variable-height rows with `initialNumToRender={0}` and
`overscanCount={5}`. The console logs mount/unmount counts. Tap a row, scroll far
away, and return: the local tap counter should reset after eviction. The focused
Maestro flow is `apps/bare-expo/e2e/swiftui-list-step2.yaml` (updated for step 3).
Settled screenshots and functional tests are not frame-time or no-blank benchmarks.

Verified after this step: 15 JS tests, package typecheck/build/lint, and the Debug
iOS simulator build pass. The updated Maestro flow passes (tap, eight flings,
return to an evicted row with reset local state, tap again, reset). With the demo's
zero pinned rows and five-row buffer, 43 distinct rows mounted during the run,
with a peak of 16 mounted at once and 9 after returning/resetting. These are
observations for this run, not a universal hard cap. No List-related SwiftUI
publishing/reentrancy warnings were found in the captured native log.

The broader bare-expo typecheck has existing errors outside this example. A future
React Native hydration proposal is separate; this implementation does not depend on it.
