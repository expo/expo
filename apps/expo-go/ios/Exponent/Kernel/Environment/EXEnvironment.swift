// Copyright 2015-present 650 Industries. All rights reserved.

@objc(EXEnvironment)
@objcMembers
public class Environment: NSObject {
    static let sharedEnvironment = Environment()

    // Whether the app was built with a Debug configuration
    private(set) var isDebugXCodeScheme: Bool = false

    // Whether the app is running in a test environment (local Xcode test target, CI, or not at all)
    var testEnvironment: TestEnvironment = .none // Assuming `.none` is a placeholder for the enum default

    private override init() {
      super.init()
      loadDefaultConfig()
    }

    // MARK: - Internal Methods

    private func reset() {
        isDebugXCodeScheme = false
    }

    private func loadDefaultConfig() {
        var isDebugScheme = false
        #if DEBUG
        isDebugScheme = true
        #endif

        resetAndLoad(isDebugScheme: isDebugScheme)
    }

    private func resetAndLoad(isDebugScheme: Bool) {
        reset()
        isDebugXCodeScheme = isDebugScheme
    }
}
