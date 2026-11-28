// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore
#if canImport(ExpoFileSystemObjC)
import ExpoFileSystemObjC
#endif

public final class FileSystemBackgroundSessionHandler: ExpoAppDelegateSubscriber, EXSessionHandlerProtocol {
  public typealias BackgroundSessionCompletionHandler = () -> Void

  // Bounds event delivery plus JS processing; completion still waits for URLSession's final event.
  private static let backgroundCompletionTimeout: TimeInterval = 25
  private let completion = BackgroundSessionCompletion()
  // Only sessions created in this process receive their final event. After a cold relaunch,
  // a session is not created again until JS uses it, so it must not be registered before that.
  private let sessionsLock = NSLock()
  private var sessionIdentifiers: Set<String> = []

  // `ExpoAppDelegateSubscriberRepository` is `@MainActor`, but URLSession setup also runs on module
  // queues (`UploadTask.start`, the legacy `uploadAsync` / `downloadAsync`), where looking the handler
  // up there trips the Swift runtime's isolation check. The repository registers every subscriber on
  // the main thread at launch, so the handler records itself then and callers on any thread read it
  // here. What they call on it off the main thread, `registerSession`, is lock-protected.
  private static let currentLock = NSLock()
  private static var _current: FileSystemBackgroundSessionHandler?

  static var current: FileSystemBackgroundSessionHandler? {
    currentLock.lock()
    defer { currentLock.unlock() }
    return _current
  }

  @objc
  public func subscriberDidRegister() {
    Self.currentLock.lock()
    defer { Self.currentLock.unlock() }
    Self._current = self
  }

  func registerSession(_ identifier: String) {
    sessionsLock.lock()
    defer { sessionsLock.unlock() }
    sessionIdentifiers.insert(identifier)
  }

  private func ownsSession(_ identifier: String) -> Bool {
    sessionsLock.lock()
    defer { sessionsLock.unlock() }
    return sessionIdentifiers.contains(identifier)
  }

  func registerDownload(_ task: FileSystemDownloadTask, forSessionIdentifier identifier: String) {
    completion.register(task, session: identifier)
  }

  func finishDownload(_ task: FileSystemDownloadTask, succeeded: Bool) {
    completion.finish(task, succeeded: succeeded)
  }

  func acknowledgeDownload(_ task: FileSystemDownloadTask) {
    completion.discard(task)
  }

  func discardDownload(_ task: FileSystemDownloadTask) {
    completion.discard(task)
  }

  public func invokeCompletionHandler(forSessionIdentifier identifier: String) {
    DispatchQueue.main.async {
      self.completion.finishEvents(identifier)
    }
  }

  // MARK: - ExpoAppDelegateSubscriber

  #if os(iOS) || os(tvOS)
  public func application(_ application: UIApplication, handleEventsForBackgroundURLSession identifier: String, completionHandler: @escaping () -> Void) {
    // Expo calls the system handler only once every subscriber has called its own, and this module
    // never receives the final event of a session it did not create, so answer for those at once.
    guard ownsSession(identifier) else {
      completionHandler()
      return
    }
    let token = completion.receiveHandler(identifier, completion: completionHandler)
    DispatchQueue.main.asyncAfter(deadline: .now() + Self.backgroundCompletionTimeout) { [weak self] in
      self?.completion.expire(identifier, token: token)
    }
  }
  #endif
}
