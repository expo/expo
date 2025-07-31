// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

class EXDevLauncherUtils {
  /**
   Swizzles implementations of given selectors.
   */
  static func swizzle(selector selectorA: Selector, withSelector selectorB: Selector, forClass: AnyClass) {
    if let methodA = class_getInstanceMethod(forClass, selectorA),
      let methodB = class_getInstanceMethod(forClass, selectorB) {
      let impA = method_getImplementation(methodA)
      let argsTypeA = method_getTypeEncoding(methodA)

      let impB = method_getImplementation(methodB)
      let argsTypeB = method_getTypeEncoding(methodB)

      if class_addMethod(forClass, selectorA, impB, argsTypeB) {
        class_replaceMethod(forClass, selectorB, impA, argsTypeA)
      } else {
        method_exchangeImplementations(methodA, methodB)
      }
    }
  }

  /**
   Swizzles implementations of given class method selectors.
   This function will backup original selector implementation for `invokeOriginalClassMethod`.
   */
  static func swizzleClassMethod(selector selectorA: Selector, withSelector selectorB: Selector, forClass: AnyClass) {
    if let methodA = class_getClassMethod(forClass, selectorA),
      let methodB = class_getClassMethod(forClass, selectorB) {
      let impA = method_getImplementation(methodA)
      let backupSelectorA = NSSelectorFromString("_" + NSStringFromSelector(selectorA))
      let metaClass = objc_getMetaClass(String(describing: forClass)) as? AnyClass
      class_addMethod(metaClass, backupSelectorA, impA, method_getTypeEncoding(methodA))
      method_setImplementation(methodA, method_getImplementation(methodB))
    }
  }

  /**
   Invokes the original implementation before swizzling for the given selector
   */
  static func invokeOriginalClassMethod(selector: Selector, forClass: AnyClass) throws -> Any? {
    typealias ClassMethod = @convention(c) (AnyObject, Selector) -> Any
    let imp = try getOriginalClassMethodImp(selector: selector, forClass: forClass)
    return unsafeBitCast(imp, to: ClassMethod.self)(self, selector)
  }

  /**
   Invokes the original implementation before swizzling for the given selector
   */
  static func invokeOriginalClassMethod(selector: Selector, forClass: AnyClass, a0: Any) throws -> Any? {
    typealias ClassMethod = @convention(c) (AnyObject, Selector, Any) -> Any
    let imp = try getOriginalClassMethodImp(selector: selector, forClass: forClass)
    return unsafeBitCast(imp, to: ClassMethod.self)(self, selector, a0)
  }

  private static func getOriginalClassMethodImp(selector: Selector, forClass: AnyClass) throws -> IMP {
    let backupSelector = NSSelectorFromString("_" + NSStringFromSelector(selector))
    guard let method = class_getClassMethod(forClass, backupSelector) else {
      fatalError("Backup selector does not exist - forClass[\(forClass)] backupSelector[\(NSStringFromSelector(backupSelector))]")
    }
    return method_getImplementation(method)
  }
}
