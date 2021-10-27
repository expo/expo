// Copyright 2018-present 650 Industries. All rights reserved.

import UIKit

/**
 Base class for app delegate subcontractors. Ensures the class
 inherits from `UIResponder` and has `required init()` initializer.
 */
@objc(EXBaseAppDelegateSubcontractor)
open class BaseExpoAppDelegateSubcontractor: UIResponder {
  public override required init() {}
}

/**
 Typealias to `UIApplicationDelegate` protocol.
 Might be useful for compatibility reasons if we decide to add more things here.
 */
@objc(EXAppDelegateSubcontractorProtocol)
public protocol ExpoAppDelegateSubcontractorProtocol: UIApplicationDelegate {}

/**
 Typealias merging the base class for app delegate subcontractors and protocol inheritance to `UIApplicationDelegate`.
 */
public typealias ExpoAppDelegateSubcontractor = BaseExpoAppDelegateSubcontractor & ExpoAppDelegateSubcontractorProtocol
