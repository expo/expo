---
'@expo/ui': patch
---

[Android] Add `DropdownMenuGroup` for Material 3 Expressive menus. When `DropdownMenu.Items` contains groups, the menu renders Compose's `DropdownMenuPopup`, and the groups and the `DropdownMenuItem`s in each group are shaped by their position. Add a `selected` prop and a `SelectedLeadingIcon` slot to `DropdownMenuItem`, which render a `SelectableDropdownMenuItem` in a group. A `DropdownMenu` in a group is a submenu: its trigger item is shaped like the group's other items, and it opens beside the trigger.
