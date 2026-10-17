---
'@expo/ui': patch
---

[iOS] Fix `List.ForEach` with `data` and a `children` render function. With recycling, `List` ignored the `moveDisabled` and `deleteDisabled` modifiers on a row. With `recycling={false}`, dragging a row did not reorder it or call `onMove`, and `onDelete` received the wrong index.
