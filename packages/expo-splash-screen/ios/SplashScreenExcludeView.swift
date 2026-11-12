// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 Marks a subtree that must not appear in the launch screen snapshot (personal or time-dependent
 content). The snapshot keeps the box at its frame, blank or filled with `placeholderColor`, so the
 layout around it stays identical when React takes over.
 */
// Internal: a public conformance to the ObjC protocol would be emitted into the generated Swift header.
final class SplashScreenExcludeView: ExpoView, SplashScreenSnapshotExcluded {
  @objc var placeholderColor: UIColor?
}
