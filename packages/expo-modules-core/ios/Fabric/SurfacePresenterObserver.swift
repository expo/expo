// Copyright 2026-present 650 Industries. All rights reserved.

@preconcurrency internal import React

/// Observes the surface presenter of the app context's host and tells the app context when the host mounts views.
/// Views created in between get that app context, see `ExpoFabricView.createComponentView`.
///
/// The surface presenter's header calls the observer API deprecated, but it's the only public notification
/// that is sent right before the host creates component views.
internal final class SurfacePresenterObserver: NSObject, RCTSurfacePresenterObserver {
  private weak var appContext: AppContext?

  init(appContext: AppContext) {
    self.appContext = appContext
  }

  /// Starts observing the given surface presenter. The presenter keeps observers weakly,
  /// so the owner of this object must keep it alive.
  func observe(_ surfacePresenter: RCTSurfacePresenterStub) {
    surfacePresenter.add(self)
  }

  // MARK: - RCTSurfacePresenterObserver

  func willMountComponents(withRootTag rootTag: Int) {
    let appContext = appContext
    MainActor.assumeIsolated {
      appContext?.hostWillMountComponents()
    }
  }

  func didMountComponents(withRootTag rootTag: Int) {
    let appContext = appContext
    MainActor.assumeIsolated {
      appContext?.hostDidMountComponents()
    }
  }
}
