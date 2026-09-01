// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore
// Under SwiftPM the ObjC sources are a separate Clang target; under CocoaPods the
// pod builds them into the same module, so the import must be conditional.
#if canImport(ExpoFileSystemObjC)
import ExpoFileSystemObjC
#endif

public final class FileSystemBackgroundSessionHandler: ExpoAppDelegateSubscriber, EXSessionHandlerProtocol {
  public typealias BackgroundSessionCompletionHandler = () -> Void

  private var completionHandlers: [String: BackgroundSessionCompletionHandler] = [:]

  public func invokeCompletionHandler(forSessionIdentifier identifier: String) {
    guard let completionHandler = completionHandlers[identifier] else {
      return
    }
    DispatchQueue.main.async {
      completionHandler()
    }
    completionHandlers.removeValue(forKey: identifier)
  }

  // MARK: - ExpoAppDelegateSubscriber

  #if os(iOS) || os(tvOS)
  public func application(_ application: UIApplication, handleEventsForBackgroundURLSession identifier: String, completionHandler: @escaping () -> Void) {
    completionHandlers[identifier] = completionHandler
  }
  #endif
}
