// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation

/// A Swift-based registry for legacy Expo modules that use the `EX_EXPORT_MODULE`
/// and `EX_REGISTER_SINGLETON_MODULE` Objective-C macros.
///
/// This registry replaces the static Objective-C data structures to enable
/// compatibility with prebuilt SPM xcframeworks while maintaining backward
/// compatibility with legacy module registration.
///
/// This made it impossible to include both files in prebuilt xcframeworks.
///
/// This Swift implementation:
/// 1. Provides real registration storage via `@_cdecl` exported C functions
/// 2. Bridges to `EXModuleRegistryProvider` for the `moduleRegistry` creation
@objc(EXLegacyModuleRegistry)
public final class LegacyModuleRegistry: NSObject, @unchecked Sendable {
    /// Shared singleton instance
    nonisolated(unsafe) public static let shared = LegacyModuleRegistry()

    /// Set of registered module classes (those using `EX_EXPORT_MODULE`)
    private var moduleClasses = Set<ObjectIdentifier>()
    private var moduleClassList = [AnyClass]()

    /// Set of registered singleton module classes (those using `EX_REGISTER_SINGLETON_MODULE`)
    private var singletonModuleClasses = Set<ObjectIdentifier>()
    private var singletonModuleClassList = [AnyClass]()

    /// Lazy-initialized singleton module instances
    private var singletonModules: [EXSingletonModule]?

    /// Thread-safety lock
    private let lock = NSLock()

    private override init() {
        super.init()
        // Register the Swift FileSystemManager which was previously hardcoded
        if let fileSystemClass = NSClassFromString("EXFileSystemLegacyUtilities") {
            registerModule(fileSystemClass)
        }
    }

    // MARK: - Module Registration

    /**
     Registers a module class.
    
     Called from `+load` methods of classes using the `EX_EXPORT_MODULE` macro.
     */
    @objc public func registerModule(_ moduleClass: AnyClass) {
        lock.lock()
        defer { lock.unlock() }

        let identifier = ObjectIdentifier(moduleClass)
        if !moduleClasses.contains(identifier) {
            moduleClasses.insert(identifier)
            moduleClassList.append(moduleClass)
        }
    }

    /**
     Registers a singleton module class.
    
     Called from `+load` methods of classes using the `EX_REGISTER_SINGLETON_MODULE` macro.
    
     Handles the subclass preference heuristic: if a subclass is registered after its
     superclass, the superclass is removed. If a superclass is registered after a subclass,
     it's ignored.
     */
    @objc public func registerSingletonModule(_ singletonModuleClass: AnyClass) {
        lock.lock()
        defer { lock.unlock() }

        // Remove any superclasses that are already registered
        // (prefer subclasses for override scenarios like ExpoKit)
        var superClass: AnyClass? = class_getSuperclass(singletonModuleClass)
        while let currentSuper = superClass, currentSuper != NSObject.self {
            let superId = ObjectIdentifier(currentSuper)
            if singletonModuleClasses.contains(superId) {
                singletonModuleClasses.remove(superId)
                singletonModuleClassList.removeAll { ObjectIdentifier($0) == superId }
            }
            superClass = class_getSuperclass(currentSuper)
        }

        // If a subclass is already registered, ignore this superclass
        for registeredClass in singletonModuleClassList {
            if class_getSuperclass(registeredClass) != nil
                && (singletonModuleClass as AnyObject).isKind(of: type(of: registeredClass))
            {
                return
            }
        }

        let identifier = ObjectIdentifier(singletonModuleClass)
        if !singletonModuleClasses.contains(identifier) {
            singletonModuleClasses.insert(identifier)
            singletonModuleClassList.append(singletonModuleClass)
        }
    }

    // MARK: - Accessing Registered Modules

    /**
     Returns all registered module classes as an NSSet for ObjC compatibility.
     */
    @objc public func getModuleClasses() -> NSSet {
        lock.lock()
        defer { lock.unlock() }
        return NSSet(array: moduleClassList)
    }

    /**
     Returns all registered module classes as an array.
     */
    @objc public func getModuleClassesArray() -> [AnyClass] {
        lock.lock()
        defer { lock.unlock() }
        return moduleClassList
    }

    /**
     Returns all singleton module instances, creating them if necessary.
     */
    @objc public func getSingletonModules() -> Set<EXSingletonModule> {
        lock.lock()
        defer { lock.unlock() }

        if let modules = singletonModules {
            return Set(modules)
        }

        // Initialize singleton instances
        var modules = [EXSingletonModule]()
        for singletonClass in singletonModuleClassList {
            if let instance = (singletonClass as? NSObject.Type)?.init() as? EXSingletonModule {
                modules.append(instance)
            }
        }
        singletonModules = modules
        return Set(modules)
    }

    /**
     Returns a singleton module instance for a specific class.
     */
    @objc public func getSingletonModule(for singletonClass: AnyClass) -> EXSingletonModule? {
        let modules = getSingletonModules()
        for singleton in modules where singleton.isKind(of: singletonClass) {
            return singleton
        }
        return nil
    }
}

// MARK: - Module Registration (called from EXModuleRegistryProvider.m)

// Note: The C functions EXRegisterModule and EXRegisterSingletonModule are
// defined in EXModuleRegistryProvider.m. Those functions forward to this
// Swift class for storage. This avoids duplicate symbol issues.
