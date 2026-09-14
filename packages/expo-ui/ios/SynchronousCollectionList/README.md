# Experimental synchronous UICollectionView list

This experiment is based directly on `main` and is independent of the SwiftUI
SynchronousList implementation. The container is an ExpoView hosting a UIKit
UICollectionView; there is no outer SwiftUI Host or List.

```tsx
import { SynchronousCollectionList } from '@expo/ui/uikit';

<SynchronousCollectionList
  style={{ flex: 1 }}
  data={items}
  renderItem={({ item, index }) => <Row item={item} index={index} />}
/>
```

The JS wrapper registers renderItem, keeps data in JS, and passes the renderer ID,
item count, and revision to native. Changes to immutable data, renderItem, or
extraData refresh the collection. Items must not be undefined. Native identities
are indices; there is no keyExtractor yet. Callback replacement and native prop
updates are separate steps, so dataset replacement/shrinkage still needs hardening.

A reusable cell requests React content during cell configuration; preferredLayoutAttributesFitting
reads the cached size (or renders again if the proposed width changed).
The runtime scheduler executes the render on the calling UI thread, coordinating
exclusive access to the shared JS runtime. A private Fabric legacy-root render
must commit before sizing returns. The row then reads the mounted height. Cached
unchanged rows return their size without rendering again.

After React commits, the renderer lays out only the row's UIKit subtree and reads
the resulting Fabric revision again. This lets an attached SwiftUI Host's geometry
callback commit its content height within the same sizing request. The settling
loop stops when the revision is unchanged, with a maximum of three passes; it does
not pump a run loop or wait for asynchronous content. Recursive row layout is
suppressed during this operation. Width changes and recycled content take this path;
unchanged measurements still use the cache.

The custom collection layout follows RNTester's numeric height/offset approach.
It uses 120-point estimates for unseen items, recomputes changed suffixes, and
binary-searches the requested viewport before allocating layout attributes.
It adjusts the scroll offset when a measured height changes entirely above the
viewport. Data revisions and width changes reset measurements. Cell prefetching
is disabled for this experiment. Reloads are deferred outside parent Fabric mounts.
All geometry queries resolve pending offset changes, including queries UIKit makes
before prepareLayout. A height correction also invalidates following visible cells'
attributes, so cached positions cannot retain the previous row height.

Run the isolated UIKit geometry regression check on a booted simulator:

```sh
python3 packages/expo-ui/scripts/test-synchronous-collection-layout.py --device SIMULATOR_UUID
```

It compiles the layout implementation from the source file and verifies growth,
shrinkage, viewport lookup, and content extent before the next prepareLayout.

Each list has a root pool retaining up to 16 idle roots in addition to active ones.
Recycled roots retain their React trees, local state, and effects. Reset item-specific
state when the item identity changes, and clean up subscriptions/async work yourself.
Independent row roots do not inherit parent React context. SwiftUI row content
can be wrapped in its own Host with vertical matchContents. Before the local layout
flush, the demo returned only 20 points of RN padding, then received full SwiftUI
heights about 290 ms later. With the flush, the first three rows return 166.3, 184.3,
and 202 points immediately, with no subsequent correction observed at startup;
root creation falls from 30 to 5. This validates the demo's initial sizing, not every
possible SwiftUI layout or scrolling performance. Ordinary React Native content needs no Host.

Later row state updates route Fabric mount notifications to the row and update
its intrinsic size. UIKit self-sizing invalidation observes the row's constraints.
Rows release roots on detachment/reuse; surplus roots and pool teardown unmount
and stop surfaces outside mutation callbacks. The JS registration is disposed
when the list unmounts.

This remains experimental: private Fabric APIs can change; runtime acquisition
and rendering block UI; mounting reentrancy, unavailable runtimes, unfinished
commits, and nonpositive/invalid heights still raise exceptions. Suspense is not
supported. The async/blank fallback was not included.

The demo route is `ui/synchronous-collection-list`. It has 10,000 variable-height
rows with expand/collapse, likes, count toggling, and mount/unmount controls. It
defaults to SwiftUI content and offers a React Native-content comparison toggle;
switching content remounts the list to reset geometry and pooled trees.
Compare identical rows against the separate SwiftUI branch. No performance win
has been established. Debug `[UICollectionSyncList]` logs summarize render work,
runtime wait, and root reuse; these are not FPS measurements. Debug launch argument
`-UICollectionSyncTraceSizing YES` logs initial and later heights for the first three rows.
