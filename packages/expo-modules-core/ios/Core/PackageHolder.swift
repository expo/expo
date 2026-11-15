// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 The modules and shared object classes of one package in the package registry. It's a value, so a package
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

  init(name: String) {
    self.name = name
  }

  /**
   The holders of the package's modules, sorted by the module name.
   */
  var moduleHolders: [ModuleHolder] {
    return modules.values.sorted { $0.name < $1.name }
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
   The names of the exports of the package in `expo.packages`: its modules, then its shared object classes.
   They are siblings, so reading the names doesn't create any of them. An export whose name is already taken
   by another export of the package is left out and logged.
   */
  var exportNames: [String] {
    var names = moduleHolders.map(\.name)
    var seenNames = Set(names)

    for sharedObjectType in sharedObjects {
      let className = sharedObjectType._jsName

      if seenNames.insert(className).inserted {
        names.append(className)
      } else {
        log.error(
          "Class '\(className)' is not available in 'expo.packages[\"\(name)\"]', "
            + "because another module or class in the '\(name)' package already has this name. "
            + "Rename the class or the module so that each name in the package is unique."
        )
      }
    }
    return names
  }

  /**
   Returns the JavaScript value of the export with the given name: a module object or a shared object class.
   Each export is created on its own when it's read first. The order of precedence is the same as in `exportNames`.
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
