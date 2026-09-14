# Experimental synchronous SwiftUI list

`SynchronousList` owns a native `SwiftUI.List(0..<itemCount, id: \.self)` directly.
There are no explicit sections, injected modifiers, or modifier props. SwiftUI
controls default styling, insets, and separators. Place it inside Host, without
an enclosing List:

```tsx
<Host style={{ flex: 1 }}>
  <SynchronousList
    data={items}
    renderItem={({ item, index }) => <Row item={item} index={index} />}
  />
</Host>
```

The component owns renderer registration and disposal. The renderer ID, native
item count, and revision are implementation details. Data, renderItem, or extraData
changes refresh native rows automatically. Keep data immutable
and renderItem stable where possible to avoid unnecessary refreshes. extraData
supports values outside data that the renderer depends on.

Native identities are indices; keyExtractor and stable identity across insertions
or reordering aren't implemented. This is a FlatList-like data API, not full
FlatList compatibility. Parent context still isn't inherited by row roots.

Each row is a UIViewRepresentable. sizeThatFits acquires a pooled Fabric root only
for a finite positive width, borrows the runtime through
RuntimeScheduler::executeNowOnTheSameThread, renders a legacy Fabric root, and
returns the mounted revision's height. No event round trip, estimated row height,
or eagerly rendered React children array is involved. SwiftUI owns realization
and may prefetch or measure offscreen rows.

Roots are independent React trees sharing the app's runtime. They don't inherit
parent React context. The pool retains at most 16 idle roots, in addition to active
roots. Idle roots retain their React trees and effects. Surplus roots and roots on
final teardown are unmounted and stopped outside mutation callbacks.

Row components always recycle: changing the item/index updates the existing React
subtree. The list doesn't reset local state for you. When using useState, reset it
when the item identity changes, as in the demo:

```tsx
function Row({ item, index }) {
  const [state, setState] = React.useState({ index, presses: 0 });
  if (state.index !== index) {
    setState({ index, presses: 0 });
  }
  return (
    <Button
      title={`${item.title}: ${state.presses}`}
      onPress={() => setState(current => ({ ...current, presses: current.presses + 1 }))}
    />
  );
}
```

Use item.id rather than index for this reset check if an item can change at the
same index. Reset during render so React retries the row before committing its
children. Also update/clean up item-specific subscriptions and cancel obsolete
async work when the item changes. Persistent item state belongs outside the row
if it must survive recycling; the demo counters intentionally don't persist.

Repeated unchanged sizing requests use cached measurements. Widths are rounded to
screen pixels. Later React height changes update the measured height and invalidate
intrinsic size after mounting. Mount notifications are routed to the owning row.

This uses private Fabric APIs and can block the UI thread while acquiring the JS
runtime or rendering. Recursive requests, requests inside an outer Fabric mount,
unavailable runtimes, and unfinished commits are rejected. Suspense is unsupported;
rows must mount with a positive finite height.

## Demo and validation

The native component list route is ui/synchronous-list. It has 10,000 variable-height
rows with hosted SwiftUI content, expandable text, like counters, count toggling,
and mount/unmount controls. The list uses native default styling, with no explicit
section grouping. Large-jump performance still needs evaluation for this structure.

Check that counters reset on reassignment, heights don't overlap, width changes
work, idle roots stay at or below 16, and roots retire after repeated unmounts. JS tests under
src/swift-ui/SynchronousList/__tests__ cover lazy renderer evaluation, registration
isolation, recycling state, unfinished/disposed requests, data/callback updates,
empty data, and automatic disposal.

Debug summaries log avgWait (runtime acquisition), avgWork (remaining render and
mount work), max (slowest full request), cached, created, reused, live, and idle.
These are per-row measurements, not FPS.
