// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class FileSystemBackgroundSessionHandler: ExpoAppDelegateSubscriber, EXSessionHandlerProtocol {
  public typealias BackgroundSessionCompletionHandler = () -> Void

  private var completionHandlers: [String: BackgroundSessionCompletionHandler] = [:]
  private var completionHandlerTokens: [String: UUID] = [:]
  private var pendingDownloads: [String: Set<String>] = [:]
  private var downloadsAwaitingCompletion: [String: Set<String>] = [:]
  private var sessionsByDownload: [String: String] = [:]
  private var finishedSessions: Set<String> = []

  public func registerDownload(_ uuid: String, forSessionIdentifier identifier: String) {
    DispatchQueue.main.async {
      self.pendingDownloads[identifier, default: []].insert(uuid)
      self.sessionsByDownload[uuid] = identifier
    }
  }

  public func completeDownload(_ uuid: String) {
    DispatchQueue.main.async {
      guard let identifier = self.sessionsByDownload.removeValue(forKey: uuid) else {
        return
      }
      self.pendingDownloads[identifier]?.remove(uuid)
      self.downloadsAwaitingCompletion[identifier]?.remove(uuid)
      if self.pendingDownloads[identifier]?.isEmpty == true {
        self.pendingDownloads.removeValue(forKey: identifier)
      }
      self.completeSessionIfReady(identifier)
    }
  }

  public func invokeCompletionHandler(forSessionIdentifier identifier: String) {
    DispatchQueue.main.async {
      guard self.completionHandlers[identifier] != nil else {
        return
      }
      self.finishedSessions.insert(identifier)
      self.completeSessionIfReady(identifier)
    }
  }

  private func completeSessionIfReady(_ identifier: String) {
    guard completionHandlers[identifier] != nil,
      finishedSessions.contains(identifier),
      downloadsAwaitingCompletion[identifier]?.isEmpty != false else {
      return
    }
    completeSession(identifier)
  }

  private func completeSession(_ identifier: String) {
    guard let completionHandler = completionHandlers.removeValue(forKey: identifier) else {
      return
    }
    completionHandlerTokens.removeValue(forKey: identifier)
    finishedSessions.remove(identifier)
    if let downloads = downloadsAwaitingCompletion.removeValue(forKey: identifier) {
      for uuid in downloads {
        pendingDownloads[identifier]?.remove(uuid)
        sessionsByDownload.removeValue(forKey: uuid)
      }
      if pendingDownloads[identifier]?.isEmpty == true {
        pendingDownloads.removeValue(forKey: identifier)
      }
    }
    completionHandler()
  }

  // MARK: - ExpoAppDelegateSubscriber

  #if os(iOS) || os(tvOS)
  public func application(_ application: UIApplication, handleEventsForBackgroundURLSession identifier: String, completionHandler: @escaping () -> Void) {
    completionHandlers[identifier] = completionHandler
    guard pendingDownloads[identifier]?.isEmpty == false else {
      return
    }
    downloadsAwaitingCompletion[identifier] = pendingDownloads[identifier]
    let token = UUID()
    completionHandlerTokens[identifier] = token
    // Give JS time to process the file, but do not hold iOS's completion handler indefinitely.
    DispatchQueue.main.asyncAfter(deadline: .now() + 25) { [weak self] in
      guard self?.completionHandlerTokens[identifier] == token else {
        return
      }
      self?.completeSession(identifier)
    }
  }
  #endif
}
