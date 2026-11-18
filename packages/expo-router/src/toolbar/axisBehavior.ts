/**
 * Where a toolbar item sits when iOS 27.1 shows a vertical bar on iPhone Duo.
 *
 * `automatic` lets the system decide from the item's content. `horizontalOnly` keeps the item in
 * the horizontal bar and hides it when no horizontal bar is present. `verticalPreferred` prefers
 * the vertical bar when both bars are present.
 *
 * @platform ios 27.1+
 */
export type ToolbarAxisBehavior = 'automatic' | 'horizontalOnly' | 'verticalPreferred';
