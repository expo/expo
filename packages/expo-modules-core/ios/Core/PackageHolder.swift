// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 The modules, shared object classes and views of one package in the package registry. It's a value, so a package
 that `PackageRegistry.package(named:)` returns doesn't change when more classes are registered.
 */
internal struct PackageHolder {
  /**
   Name of the package: the npm package name, or `ExpoPackage.localPackageName`.
   */
  let name: String

  /**
   Holders of the package's modules, keyed by the module name.
   */
  var modules: [String: ModuleHolder] = [:]

  /**
   Shared object classes that the package exports next to its modules.
   */
  var sharedObjects: [SharedObject.Type] = []

  /**
   View classes that the package exports next to its modules.
   */
  var views: [any AnyNativeView.Type] = []

  init(name: String) {
    self.name = name
  }

  /**
   Returns the holder of the module with the given name.
   */
  func moduleHolder(named moduleName: String) -> ModuleHolder? {
    return modules[moduleName]
  }

  /**
   Returns the shared object class with the given JavaScript name.
   */
  func sharedObjectType(named className: String) -> SharedObject.Type? {
    return sharedObjects.first { $0._jsName == className }
  }

  /**
   Returns the view class with the given name. Read it after `export(named:appContext:)`, because a module
   or a shared object class with the same name takes precedence.
   */
  func viewType(named viewName: String) -> (any AnyNativeView.Type)? {
    return views.first { $0._jsName == viewName }
  }

  /**
   The names of the exports of the package in `expo.packages`: its modules, then its shared object classes,
   then its views. They are siblings, so reading the names doesn't create any of them. An export whose name
   is already taken by another export of the package is left out and logged.
   */
  var exportNames: [String] {
    var names = modules.keys.sorted()

    func append(_ exportName: String, kind: String) {
      // A package has few exports, so a linear search is faster than hashing the names into a set.
      guard !names.contains(exportName) else {
        log.error(
          "\(kind) '\(exportName)' is not available in 'expo.packages[\"\(name)\"]', "
            + "because another export of the '\(name)' package already has this name. "
            + "Rename it so that each name in the package is unique."
        )
        return
      }
      names.append(exportName)
    }
    for sharedObject in sharedObjects {
      append(sharedObject._jsName, kind: "Class")
    }
    for view in views {
      append(view._jsName, kind: "View")
    }
    return names
  }

  /**
   Returns the JavaScript value of the module or shared object class with the given name. Each export is
   created on its own when it's read first. The order of precedence is the same as in `exportNames`. Views
   are read with `viewType(named:)`, because the package object caches their components.
   */
  @JavaScriptActor
  func export(named exportName: String, appContext: AppContext) throws -> JavaScriptValue? {
    if let holder = moduleHolder(named: exportName) {
      return holder.getJavaScriptValue()
    }
    if let sharedObjectType = sharedObjectType(named: exportName) {
      return try appContext.getSharedObjectClass(sharedObjectType).asValue()
    }
    return nil
  }
}
