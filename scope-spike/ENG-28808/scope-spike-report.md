# ENG-28808 — Stack ownership through SplitView swizzling

2026-11-05. Exploratory result, not a release implementation.

## Context and conclusion

**Native ownership is possible at the expanded Stack root, but replacing the wrapper after mounting is not a complete integration.** The real app fails in collapsed presentation and loses header/layout behavior on an expanded push. Do not extend the existing header-mirroring approach and call it native integration; do not ship this prototype either.

The test uses the original Screens navigation controller and navigation items. It contains no header-item copying, fade, transition mask, timed view repair, or JavaScript header-height override. Passing UIKit identity tests did not predict the actual Screens lifecycle failures. Both results are preserved here.

References compared:

- `test/pr-52564-header-gesture`, `b590a9984e`: this spike's base; applies split header visibility during appearance.
- `jakub-tkacz/eng-28808-router-integrate-stack-with-splitview`, `5af6a1d579`: resting-root header mirroring, separate navigation histories, root gesture coordination, header-height bridging, and bounded custom-view repairs.
- [ENG-28808](https://linear.app/expo/issue/ENG-28808/router-integrate-stack-with-splitview), its comments and “learnings and take-aways” attachment. Existing reported test counts were not treated as this spike's results.
- PRs [52506](https://github.com/expo/expo/pull/52506) and [52564](https://github.com/expo/expo/pull/52564): both open at inspection; no inline review comments returned.

## Approach

The prototype removes the secondary column's extra navigation wrapper and gives UIKit the column controller with its original Screens navigation controller as its first child. The Stack retains its controllers, delegate, and navigation items. Expo-owned swizzles adapt attachment, column lookup, and secondary-bar refresh.

This uses a containment shape described by [Apple's column assignment documentation](https://developer.apple.com/documentation/uikit/uisplitviewcontroller/setviewcontroller(_:for:)). That documentation supports the shape, not the timing of replacing an already-mounted Screens wrapper or all of Screens' lifecycle assumptions.

The demo is opt-in. Enable it in place from the secondary screen or sidebar. Restart the app for a fresh baseline. The baseline-remount control is separate from enabling integration. Horizontal inset removal defaults to **off** and has its own visible toggle.

## Observed behavior

Runtime: fresh local Debug build from this worktree, served by its own Metro, installed on a task-owned EAS Argent session. Devices: iPhone 17 Pro and iPad Pro 13-inch (M5), both iOS 26.5. Screens: installed, unpatched `4.30.1`.

| State / option | Expected | Observed | Evidence |
| --- | --- | --- | --- |
| iPhone baseline | Existing nested headers | Split header plus real Stack large-title header | [Baseline](media/iphone-baseline.png) |
| iPhone enable in place | One Stack header and visible content | **Fail:** blank content, only primary column heading remains; persists after waiting and reopening the route | [Live adoption failure](media/iphone-integration-live-adoption.png), [tree](iphone-failed-tree.json) |
| iPhone original remount toggle | Same ownership experiment | Also blank; reproduced without remount, so remount alone does not explain it | [Initial failure](media/iphone-integration-remount.png) |
| iPad baseline | Existing nested headers | Two secondary headers | [Baseline](media/ipad-baseline.png) |
| iPad root ownership | Stack owns the column header | **Pass at root:** column header disappears, real Stack large title remains; report says `secondaryClass: RNSSplitScreenController`, child `RNSNavigationController`, `integrated: true`, `topItemIsScreenItem: true` | [Integrated root](media/ipad-integrated-root.png) |
| iPad push | New title and correctly inset content | **Fail:** depth becomes 2 with screen/item identity intact, but configured “Pushed screen” title is blank and content appears under the bar/status area | [Pushed screen](media/ipad-integrated-pushed.png) |
| iPad native Back | Return to existing Stack root | Root and large title return after native Back tap; this does not prove interactive cancellation | Root observed again before header-toggle captures |
| Root `headerShown: false` | Hide the Stack header | Title/bar visibility changes; old content gap remains, so correct inset behavior is **not** established | [Hidden](media/ipad-integrated-hidden.png) |
| Root `headerLargeTitle: false` | Inline Stack title | Inline title appears | [Inline](media/ipad-integrated-inline.png) |
| Root title update | Update the owned navigation item | “Stack root 0” becomes “Stack root 1” | [Updated title](media/ipad-integrated-title-update.png), [final tree](ipad-final-tree.json) |
| `gestureEnabled: false` | Block the relevant native gesture | Not verified; root column gesture belongs to the primary navigator and needs explicit ownership rules | No claim |
| Sheet / nested Stack | Preserve ownership and native dismissal | Demo cases present, not exercised after the push/collapsed blockers | No claim |
| Expand/collapse, retained route state, inspector, Duo rails, older iOS | Preserve controllers/state/layout | Not verified; available runtime is iOS 26.5, not Duo's required runtime | No claim |

Diagnostics are sampled by **Inspect ownership**; some intermediate screenshots retain the earlier depth-2 sample after Back. They are not a continuous state trace. The final tree was explicitly refreshed at the root. Screenshots prove settled states, not animation quality; no gesture-completion or cancellation claim is made.

## Risks and blockers

1. **Collapsed composition is the first blocker.** Late wrapper removal blanks a real collapsed split even without React remount. Unit tests use a real Screens navigation controller inside ordinary UIKit containers and do not exercise that mounted hierarchy.
2. **Header and inset lifecycle is the second blocker.** Expanded root adoption is visible and real, but push behavior fails. The exact cause of the title/inset failure is not isolated; it would be incorrect to label it a styling defect.
3. **Wrapper responsibilities must move with ownership.** Screens' `RNSSplitNavigationController` installs a frame-origin observer. The host uses it to notify columns through `columnPositioningDidChangeInSplitViewController:`. Removing the wrapper removes that observer path.
4. **Rebuild and teardown are unimplemented.** Screens can recreate column wrappers. The prototype's weak registration does not establish re-adoption, restoration to plain content, or conditional Stack lifecycle guarantees.
5. **Runtime coupling is deliberate and unstable.** Hooks depend on `RNSScreenStackView.reactAddControllerToClosestParent:`, `RNSSplitHostController.splitScreenControllers`, `refreshSecondaryNavBar`, and `_visibleColumns`. Guards check their presence. A dependency upgrade can still change semantics or method signatures.

These findings show missing responsibilities in this prototype. They do **not** prove that every swizzling-based implementation is impossible or that an upstream change is mandatory.

## Recommended implementation scope

Keep separate JavaScript Stack and column histories, as the ticket specifies. Aim for automatic ownership by a direct content-column Stack, with no public header-mirroring API. Use swizzling as an experiment to establish the full native contract before deciding which hooks should become supported Screens extension points.

1. Establish attachment **before** UIKit commits its collapsed column composition, or implement an explicit collapse/expand transfer that preserves ownership. Reproduce the blank-content case with real `RNSSplitHostController` and mounted Screens views before changing it. Do not mask it with a fade or force a React remount.
2. Preserve the Stack's header-config callbacks, navigation delegate, scroll-view discovery, safe-area updates, and original navigation items throughout push/pop. Reproduce the expanded blank-title/inset failure first. Prove root → pushed → root with native and JS Back before adding more options.
3. Transfer frame-origin observation and reconcile wrapper rebuilds, Stack removal, route replacement, and nested navigators. Limit ownership to the intended direct Stack; never adopt a descendant Stack from another navigator.
4. Define native root-column Back separately from internal Stack Back. Cover both edge and content-pop recognizers, cancellation, disabled gestures, modal coverage, and JS actions without dismissing unrelated JS routes.
5. Verify automatic compact-only rail/inset behavior, iPad window resizing, inspector changes, and Duo on a suitable runtime. Preserve controller identity and route state through layout changes.

Likely edit areas: the native Stack attachment path in Screens; split host column creation/lookup and layout observation; Expo's native split adapter; existing Router action coordination if root JS Back requires a bridge. The current reference branch's route-selection work can be evaluated separately from its header-mirroring implementation. No public API break is proposed or implemented here.

## Verification performed

- `pnpm install --frozen-lockfile --ignore-scripts`: passed; no lockfile change.
- Workspace dependency builds: passed (55 cached tasks).
- `et check-packages expo-router`: passed, with one existing `no-void` warning in untouched `src/__tests__/useScreens.test.web.tsx`. This command's completion is not a claim that all JS tests ran; its output did not report a Jest test count.
- Native `build-for-testing` and focused `SplitViewNativeStackTests`: **6/6 passed** on iPad iOS 26.5. Checks cover actual Screens controller/item/delegate identity, push/pop identity, unsupported containment rejection, and hook availability.
- RouterTester Debug app build: passed. Its generated Podfile enabled the ExpoRouter test spec and linked the test bundle with `-lc++`; generated native setup is not part of the task diff.
- Focused JS formatting/lint and Swift format lint: passed. Final demo formatting and diff-whitespace checks: passed.
- Tester TypeScript passed before Metro generated route types. **Final whole-app typecheck fails** on `/404` hrefs in three untouched routes: `app/link-preview/misc.tsx:133`, `app/tabs/faces/[face].tsx:59`, and `app/tabs/index.tsx:142`. No unrelated route changes were made to conceal this failure.
- Native tests were written before implementation, but a failing pre-implementation native run was not obtained during environment setup. Do not present this as a completed red/green TDD cycle.
- An additional window-hosted rejection test could not run in this hostless test bundle (`UIApplication.shared.connectedScenes.first` was nil). It was not retained. Collapsed behavior is supported by the real app evidence, not that failed test setup.
- No plan-challenge or review agent was run, as requested. An implementation agent and environment inspector assisted the work.

## Reproduce

Open `router-tester://split-view-native-stack/stack` in a fresh development build containing this spike. The screen starts in baseline mode. Tap **Enable native integration** on the Stack screen.

- iPhone: observe the blank-content failure.
- Expanded iPad: verify one root header, press **Push screen**, observe the missing title/insets, then native Back. Toggle hidden/large-title and change the root title from the sidebar.
- Restart the app to reset to baseline. The experiment does not restore ownership on demand.

All runtime media above was opened and inspected. Remote sessions and the task's Metro/host are stopped after capture. No Linear comment or PR was posted.
