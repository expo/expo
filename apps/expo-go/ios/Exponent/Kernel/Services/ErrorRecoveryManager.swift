// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import React

@objc(EXErrorRecoveryScopedModuleDelegate)
public protocol ErrorRecoveryScopedModuleDelegate {
  func setDeveloperInfo(_ developerInfo: NSDictionary, forScopedModule scopedModule: Any)
}

private class ErrorRecoveryRecord {
  var isRecovering: Bool = false
  var error: NSError?
  var dtmLastLoaded: Date?
  var developerInfo: NSDictionary?
}

@objc(EXErrorRecoveryManager)
@objcMembers
public final class ErrorRecoveryManager: NSObject, ErrorRecoveryScopedModuleDelegate {
  private static let autoRefreshBufferBaseSeconds: TimeInterval = 5.0

  private var experienceInfo: [String: ErrorRecoveryRecord] = [:]
  private let lock = NSLock()
  private var reloadBufferDepth: UInt = 0
  private var dtmAnyExperienceLoaded: Date = Date()

  public override init() {
    super.init()
  }

  public func setDeveloperInfo(_ developerInfo: NSDictionary?, forScopeKey scopeKey: String) {
    assert(scopeKey.count > 0, "Cannot associate recovery info with an empty scope key")

    lock.lock()
    defer { lock.unlock() }

    let record = getOrCreateRecord(forScopeKey: scopeKey)
    record.developerInfo = developerInfo
  }

  public func developerInfo(forScopeKey scopeKey: String) -> NSDictionary? {
    lock.lock()
    defer { lock.unlock() }

    return experienceInfo[scopeKey]?.developerInfo
  }

  public func setDeveloperInfo(_ developerInfo: NSDictionary, forScopedModule scopedModule: Any) {
    if let scopeKey = (scopedModule as AnyObject).value(forKey: "scopeKey") as? String {
      setDeveloperInfo(developerInfo, forScopeKey: scopeKey)
    }
  }

  public func setError(_ error: NSError?, forScopeKey scopeKey: String) {
    assert(scopeKey.count > 0, "Cannot associate an error with an empty scope key")

    lock.lock()
    defer { lock.unlock() }

    if let error {
      let record = getOrCreateRecord(forScopeKey: scopeKey)
      record.isRecovering = true

      if record.error != nil,
         error.localizedDescription.contains("AppRegistry is not a registered callable module") {
        NSLog("[EXErrorRecoveryManager] Ignoring misleading error: %@", error)
      } else {
        record.error = error
      }
    } else if let record = experienceInfo[scopeKey] {
      record.error = nil
    }
  }

  public func experienceFinishedLoading(withScopeKey scopeKey: String) {
    assert(scopeKey.count > 0, "Cannot mark an experience with an empty scope key as loaded")

    lock.lock()
    defer { lock.unlock() }

    let record = getOrCreateRecord(forScopeKey: scopeKey)
    record.dtmLastLoaded = Date()
    record.isRecovering = false

    dtmAnyExperienceLoaded = Date()
  }

  public func scopeKeyIsRecoveringFromError(_ scopeKey: String) -> Bool {
    lock.lock()
    defer { lock.unlock() }

    return experienceInfo[scopeKey]?.isRecovering ?? false
  }

  public func errorBelongsToExperience(_ error: NSError?) -> Bool {
    guard let error else { return false }

    lock.lock()
    let errors: [NSError] = experienceInfo.values.compactMap { $0.error }
    lock.unlock()

    return errors.contains { isJSError($0, equalTo: error) }
  }

  @objc(appRecordForError:)
  public func appRecord(for error: NSError?) -> EXKernelAppRecord? {
    guard let error else { return nil }

    lock.lock()
    let scopeKeyAndErrors: [String: NSError] = experienceInfo.compactMapValues { $0.error }
    lock.unlock()

    for (scopeKey, recordError) in scopeKeyAndErrors {
      if isJSError(recordError, equalTo: error) {
        return EXKernel.sharedInstance().appRegistry.newestRecord(withScopeKey: scopeKey)
      }
    }
    return nil
  }

  public func experienceShouldReload(onError scopeKey: String) -> Bool {
    lock.lock()
    defer { lock.unlock() }

    guard let record = experienceInfo[scopeKey],
          let dtmLastLoaded = record.dtmLastLoaded else {
      return false
    }

    return dtmLastLoaded.timeIntervalSinceNow < -reloadBufferSeconds
  }

  public func increaseAutoReloadBuffer() {
    lock.lock()
    defer { lock.unlock() }
    reloadBufferDepth += 1
  }

  private func getOrCreateRecord(forScopeKey scopeKey: String) -> ErrorRecoveryRecord {
    if let existing = experienceInfo[scopeKey] {
      return existing
    }
    let record = ErrorRecoveryRecord()
    experienceInfo[scopeKey] = record
    return record
  }

  private func isJSError(_ error1: NSError?, equalTo error2: NSError?) -> Bool {
    guard let error1, let error2 else {
      return error1 == nil && error2 == nil
    }

    if error1.domain.contains(RCTErrorDomain) && error2.domain.contains(RCTErrorDomain) {
      let desc1 = error1.userInfo[NSLocalizedDescriptionKey] as? String
      let desc2 = error2.userInfo[NSLocalizedDescriptionKey] as? String
      return desc1 == desc2
    }

    return error1.isEqual(error2)
  }

  private var reloadBufferSeconds: TimeInterval {
    var interval = min(60.0 * 5.0, Self.autoRefreshBufferBaseSeconds * pow(1.5, Double(reloadBufferDepth)))

    if dtmAnyExperienceLoaded.timeIntervalSinceNow < -(interval * 2.0) {
      reloadBufferDepth = 0
      interval = Self.autoRefreshBufferBaseSeconds
    }

    return interval
  }
}
