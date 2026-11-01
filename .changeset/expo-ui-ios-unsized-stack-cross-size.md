---
'@expo/ui': patch
---

[iOS] Fix a universal `Row` or `Column` with no size on its cross axis laying out at 0 when a child such as `List` has no ideal cross size, so the child rendered nothing. Only a `Spacer` is measured without a cross proposal now.
