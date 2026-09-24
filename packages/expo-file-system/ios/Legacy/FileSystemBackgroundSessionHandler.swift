// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class FileSystemBackgroundSessionHandler: ExpoAppDelegateSubscriber, EXSessionHandlerProtocol {
  public typealias BackgroundSessionCompletionHandler = () -> Void

  private var completionHandlers: [String: BackgroundSessionCompletionHandler] = [:]
  private var completionHandlerTokens: [String: UUID] = [:]
  private var downloadsAwaitingAcknowledgment: [String: Set<String>] = [:]
  private var sessionsByDownload: [String: String] = [:]
  private var finishedSessions: Set<String> = []

  public func registerDownload(_ uuid: String, forSessionIdentifier identifier: String) {
    DispatchQueue.main.async {
      self.sessionsByDownload[uuid] = identifier
    }
  }

  public func finishDownload(_ uuid: String, succeeded: Bool) {
    DispatchQueue.main.async {
      guard let identifier = self.sessionsByDownload[uuid] else {
        return
      }
      if succeeded {
        self.downloadsAwaitingAcknowledgment[identifier, default: []].insert(uuid)
      } else {
        self.discardDownloadNow(uuid)
      }
    }
  }

  public func completeDownload(_ uuid: String) {
    discardDownload(uuid)
  }

  public func discardDownload(_ uuid: String) {
    DispatchQueue.main.async {
      self.discardDownloadNow(uuid)
    }
  }

  private func discardDownloadNow(_ uuid: String) {
    guard let identifier = sessionsByDownload.removeValue(forKey: uuid) else {
      return
    }
    downloadsAwaitingAcknowledgment[identifier]?.remove(uuid)
    if downloadsAwaitingAcknowledgment[identifier]?.isEmpty == true {
      downloadsAwaitingAcknowledgment.removeValue(forKey: identifier)
    }
    completeSessionIfReady(identifier)
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
      downloadsAwaitingAcknowledgment[identifier]?.isEmpty != false else {
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
    if let downloads = downloadsAwaitingAcknowledgment.removeValue(forKey: identifier) {
      for uuid in downloads {
        sessionsByDownload.removeValue(forKey: uuid)
      }
    }
    completionHandler()
  }

  // MARK: - ExpoAppDelegateSubscriber

  #if os(iOS) || os(tvOS)
  public func application(_ application: UIApplication, handleEventsForBackgroundURLSession identifier: String, completionHandler: @escaping () -> Void) {
    completionHandlers[identifier] = completionHandler
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
