import ExpoModulesCore

private let codedException = Exception(name: "TestException",
                                       description: "This is a test Exception with a code",
                                       code: "E_TEST_CODE")

public class ExpoModulesExceptionTestModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoModulesExceptionTest")

        Function("codedException") {
            throw codedException
        }

        AsyncFunction("codedExceptionRejectAsync") { (promise: Promise) in
            promise.reject(codedException)
        }

        AsyncFunction("codedExceptionThrowAsync") { () in
            throw codedException
        }

        AsyncFunction("codedExceptionConcurrentAsync") { () async throws in
            throw codedException
        }
    }
}
