---
"@expo/ui": patch
---

[iOS] Added `LazyVStack.ForEach` and `LazyHStack.ForEach`, which render rows from `data` and `keyExtractor` with a `children` function: `{({ item, index }) => <Row item={item} />}`. Rows are recycled from a small pool around the visible range, so large stacks only render the rows near the viewport. Set `recycling={false}` to render every row.

See: [#50579](https://github.com/expo/expo/pull/50579)
