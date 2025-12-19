// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation

/// Factory class for creating AppContext instances from Objective-C without importing Swift.h.
/// This breaks the ObjC → Swift → ObjC cyclic dependency by providing a factory pattern.
///
/// The ObjC code calls `createAppContext` class method directly on this class via runtime lookup.
@objc(EXAppContextFactory)
public final class AppContextFactory: NSObject, EXAppContextFactoryProtocol {

    /**
     Creates a new AppContext instance.
     Called from ObjC code that needs to instantiate AppContext without importing Swift.h.
     */
    @objc
    public static func createAppContext() -> EXAppContextProtocol {
        return AppContext()
    }
}

// MARK: - AppContext Protocol Conformance

/// Declare that AppContext conforms to EXAppContextProtocol.
/// The actual methods are implemented in AppContext.swift with @objc annotations.
extension AppContext: EXAppContextProtocol {}
