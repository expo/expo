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
  /// The newest app context that observes each surface presenter. After quick consecutive reloads, an app context
  /// of an older runtime can find the presenter of a newer one, so only the newest app context is used for its views.
  private static let appContextsBySurfacePresenter = NSMapTable<AnyObject, AppContext>.weakToWeakObjects()

  private weak var appContext: AppContext?

  /// The observed surface presenter, or `nil` when this object isn't added to any presenter.
  private weak var surfacePresenter: AnyObject?

  /// The app context that was mounting when this host started mounting. Hosts don't mount inside their own
  /// mount transaction, but another host might, so the previous app context is restored afterwards.
  private weak var previousMountingAppContext: AppContext?

  /// Whether this observer set the mounting app context for the current mount transaction.
  private var isMounting = false

  nonisolated init(appContext: AppContext) {
    self.appContext = appContext
  }

  /// Starts observing the given surface presenter. Returns `false` and doesn't observe it when a newer app context
  /// already observes the presenter. The presenter keeps observers weakly, so the owner of this object must keep it alive.
  @discardableResult
  func observe(_ surfacePresenter: RCTSurfacePresenterStub) -> Bool {
    guard let appContext else {
      return false
    }
    if let currentAppContext = Self.appContextsBySurfacePresenter.object(forKey: surfacePresenter),
      currentAppContext.appIndex > appContext.appIndex {
      return false
    }
    Self.appContextsBySurfacePresenter.setObject(appContext, forKey: surfacePresenter)
    self.surfacePresenter = surfacePresenter
    surfacePresenter.add(self)
    return true
  }

  /// Whether views mounted by the observed presenter belong to this observer's app context.
  private var isObservingNewestAppContext: Bool {
    guard let surfacePresenter else {
      return true
    }
    return Self.appContextsBySurfacePresenter.object(forKey: surfacePresenter) === appContext
  }

  // MARK: - RCTSurfacePresenterObserver

  func willMountComponents(withRootTag rootTag: Int) {
    guard isObservingNewestAppContext else {
      return
    }
    isMounting = true
    previousMountingAppContext = AppContext.mountingAppContext
    AppContext.mountingAppContext = appContext
  }

  func didMountComponents(withRootTag rootTag: Int) {
    guard isMounting else {
      return
    }
    isMounting = false
    AppContext.mountingAppContext = previousMountingAppContext
    previousMountingAppContext = nil
  }
}
