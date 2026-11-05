# Native Stack in SplitView spike

## Context

ENG-28808 asks for a nested Stack to own the content column's native header, preserve navigation state across layout changes, and return through Stack history before returning to the previous split column. This spike investigates actual UIKit containment through Expo-owned swizzles of react-native-screens 4.30.1.

The isolated branch starts at `b590a9984e` (`test/pr-52564-header-gesture`). The comparison branch is `jakub-tkacz/eng-28808-router-integrate-stack-with-splitview` at `5af6a1d579`. Neither reference branch is modified.

## Approach

Make the existing Screens navigation controller the navigation controller UIKit recognizes for the secondary column. Preserve its screen controllers, navigation items, delegate, and JavaScript Stack state. Avoid moving header views between bars or recreating navigation controllers.

Apple documents that a secondary column controller whose first child is a navigation controller can use that child's navigation controller for the split's display-mode controls: [setViewController(_:for:)](https://developer.apple.com/documentation/uikit/uisplitviewcontroller/setviewcontroller(_:for:)). This establishes a supported containment shape, but does not by itself prove Screens integration or compact-layout behavior.

## Comparison

| Approach | What it changes | Evidence and remaining issue |
| --- | --- | --- |
| Header-gesture reference | Applies column bar visibility during native appearance | Small fix for per-column visibility; does not integrate a nested Stack's controller ownership. |
| Existing integration reference | Mirrors a resting Stack root into the shared split bar and returns its items before an internal push | Ticket attachment reports native transitions, but also timed custom-view repairs, a header-height bridge, inline-only root large titles, and an intermittent inset problem. Those reported runtime results were not rerun in this spike. |
| This prototype | Removes the extra secondary navigation wrapper and retains the original Screens navigation controller beneath its column controller | Opt-in containment experiment. Must validate native callbacks, transitions, collapse/expand, and teardown before automatic integration. |

## Risks

- Screens assumes its split columns are wrapped in navigation controllers. Replacing the wrapper requires adapting column lookup and secondary-bar refresh as well as initial attachment.
- The methods and `_visibleColumns` field used by the swizzles are Screens implementation details, not a stable extension API. Installation must fail closed when prerequisites are absent.
- UIKit support for the containment shape is not a promise that replacing the wrapper during a compact transition is safe.
- A persistent, direct Stack in the secondary column is a narrower case than arbitrary conditional navigators, nested Stacks, inspectors, or replacing the Stack with plain content.
- A native column pop and a JavaScript Stack pop belong to different histories. Do not turn a column transition into screen dismissal or lose JS routes on layout changes.

## Implementation

- Native opt-in marker, scoped method hooks, and ownership diagnostics: `packages/expo-router/ios/SplitView/SplitViewNativeStackView.swift`.
- Native contract tests: `packages/expo-router/ios/Tests/SplitViewNativeStackTests.swift`.
- Router tester demo: see the final scope report for route and exact supported states.

## Verification

The final `scope-spike-report.md` records results, commands, observed behavior, and unverified cases. A structural unit test is not proof of interactive gestures or visual correctness.

This is exploratory code, not a release-ready change. No PR or Linear comment is created by this task.
