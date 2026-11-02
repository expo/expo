// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class FileSystemBackgroundSessionHandler: ExpoAppDelegateSubscriber, EXSessionHandlerProtocol {
  public typealias BackgroundSessionCompletionHandler = () -> Void

  // Bounds event delivery plus JS processing; completion still waits for URLSession's final event.
  private static let backgroundCompletionTimeout: TimeInterval = 25
  private let completion = BackgroundSessionCompletion()

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
    let token = completion.receiveHandler(identifier, completion: completionHandler)
    DispatchQueue.main.asyncAfter(deadline: .now() + Self.backgroundCompletionTimeout) { [weak self] in
      self?.completion.expire(identifier, token: token)
    }
  }
  #endif
}
