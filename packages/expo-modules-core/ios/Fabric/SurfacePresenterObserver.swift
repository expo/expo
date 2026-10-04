// Copyright 2026-present 650 Industries. All rights reserved.

@preconcurrency internal import React

/// Observes the surface presenter of the app context's host and tells the app context when the host mounts views.
/// Views created in between get that app context, see `ExpoFabricView.createComponentView`.
///
/// The surface presenter's header calls the observer API deprecated, but it's the only public notification
/// that is sent right before the host creates component views.
// The surface presenter calls its observers on the main thread.
@MainActor
internal final class SurfacePresenterObserver: NSObject, @preconcurrency RCTSurfacePresenterObserver {
  private weak var appContext: AppContext?

  /// The app context that was mounting when this host started mounting. Hosts don't mount inside their own
  /// mount transaction, but another host might, so the previous app context is restored afterwards.
  private weak var previousMountingAppContext: AppContext?

  nonisolated init(appContext: AppContext) {
    self.appContext = appContext
  }

  /// Starts observing the given surface presenter. The presenter keeps observers weakly,
  /// so the owner of this object must keep it alive.
  nonisolated func observe(_ surfacePresenter: RCTSurfacePresenterStub) {
    surfacePresenter.add(self)
  }

  // MARK: - RCTSurfacePresenterObserver

  func willMountComponents(withRootTag rootTag: Int) {
    previousMountingAppContext = AppContext.mountingAppContext
    AppContext.mountingAppContext = appContext
  }

  func didMountComponents(withRootTag rootTag: Int) {
    AppContext.mountingAppContext = previousMountingAppContext
    previousMountingAppContext = nil
  }
}
