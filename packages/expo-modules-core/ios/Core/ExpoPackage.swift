// Copyright 2026-present 650 Industries. All rights reserved.

/**
 The native exports of one npm package that are declared with the Expo Modules API 2.0 macros: its modules,
 shared object classes and views. A modules provider returns the packages keyed by the npm package name, and that name
 is the JS name of the package.
 Local and inline modules are in the `$local` package.
 */
public struct ExpoPackage {
  /**
   Name of the package of local and inline modules. It can't be the name of an npm package.
   */
  public static let localPackageName = "$local"

  /**
   Module classes of the package.
   */
  public let modules: [AnyModule.Type]

  /**
   Shared object classes of the package. They are exported next to the modules, not as members of a module.
   */
  public let sharedObjects: [SharedObject.Type]

  /**
   View classes of the package. They are exported next to the modules, not as members of a module.
   */
  public let views: [any AnyNativeView.Type]

  public init(
    modules: [AnyModule.Type] = [],
    sharedObjects: [SharedObject.Type] = [],
    views: [any AnyNativeView.Type] = []
  ) {
    self.modules = modules
    self.sharedObjects = sharedObjects
    self.views = views
  }
}
