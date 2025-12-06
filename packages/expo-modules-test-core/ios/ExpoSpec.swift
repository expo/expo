// Copyright 2022-present 650 Industries. All rights reserved.

#if DEBUG
@_exported @preconcurrency import Quick
@_exported @preconcurrency import Nimble
@_exported @testable @preconcurrency import ExpoModulesCore

@MainActor
@preconcurrency
open class ExpoSpec: QuickSpec {}
#endif
