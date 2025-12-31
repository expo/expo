import SwiftSyntax
import SwiftSyntaxBuilder
import SwiftSyntaxMacros
import SwiftSyntaxMacrosTestSupport
import XCTest

// Macro implementations build for the host, so the corresponding module is not available when cross-compiling. Cross-compiled tests may still make use of the macro itself in end-to-end tests.
#if canImport(ExpoModulesOptimizedMacros)
import ExpoModulesOptimizedMacros

let testMacros: [String: Macro.Type] = [
    "OptimizedFunction": OptimizedFunctionAttachedMacro.self,
]
#endif

final class ExpoModulesOptimizedTests: XCTestCase {
    func testAttachedMacroWithDoubleDoubleToDouble() throws {
        #if canImport(ExpoModulesOptimizedMacros)
        assertMacroExpansion(
            """
            @OptimizedFunction("addNumbers")
            private func addNumbersImpl(a: Double, b: Double) -> Double {
                return a + b
            }
            """,
            expandedSource: """
            private func addNumbersImpl(a: Double, b: Double) -> Double {
                return a + b
            }

            private func addNumbers() -> AnyDefinition {
                return _createOptimizedFunction(
                    name: "addNumbers",
                    typeEncoding: "d@?dd",
                    argsCount: 2,
                    block: (addNumbersImpl as @convention(block) (Double, Double) -> Double) as AnyObject
                )
            }
            """,
            macros: testMacros
        )
        #else
        throw XCTSkip("macros are only supported when running tests for the host platform")
        #endif
    }

    func testAttachedMacroWithIntIntToInt() throws {
        #if canImport(ExpoModulesOptimizedMacros)
        assertMacroExpansion(
            """
            @OptimizedFunction("addInts")
            private func addIntsImpl(a: Int, b: Int) -> Int {
                return a + b
            }
            """,
            expandedSource: """
            private func addIntsImpl(a: Int, b: Int) -> Int {
                return a + b
            }

            private func addInts() -> AnyDefinition {
                return _createOptimizedFunction(
                    name: "addInts",
                    typeEncoding: "q@?qq",
                    argsCount: 2,
                    block: (addIntsImpl as @convention(block) (Int, Int) -> Int) as AnyObject
                )
            }
            """,
            macros: testMacros
        )
        #else
        throw XCTSkip("macros are only supported when running tests for the host platform")
        #endif
    }

    func testAttachedMacroWithSingleParameter() throws {
        #if canImport(ExpoModulesOptimizedMacros)
        assertMacroExpansion(
            """
            @OptimizedFunction("double")
            private func doubleImpl(x: Double) -> Double {
                return x * 2
            }
            """,
            expandedSource: """
            private func doubleImpl(x: Double) -> Double {
                return x * 2
            }

            private func double() -> AnyDefinition {
                return _createOptimizedFunction(
                    name: "double",
                    typeEncoding: "d@?d",
                    argsCount: 1,
                    block: (doubleImpl as @convention(block) (Double) -> Double) as AnyObject
                )
            }
            """,
            macros: testMacros
        )
        #else
        throw XCTSkip("macros are only supported when running tests for the host platform")
        #endif
    }

    func testAttachedMacroWithVoidReturnType() throws {
        #if canImport(ExpoModulesOptimizedMacros)
        assertMacroExpansion(
            """
            @OptimizedFunction("doNothing")
            private func doNothingImpl() {
                print("nothing")
            }
            """,
            expandedSource: """
            private func doNothingImpl() {
                print("nothing")
            }

            private func doNothing() -> AnyDefinition {
                return _createOptimizedFunction(
                    name: "doNothing",
                    typeEncoding: "v@?",
                    argsCount: 0,
                    block: (doNothingImpl as @convention(block) () -> Void) as AnyObject
                )
            }
            """,
            macros: testMacros
        )
        #else
        throw XCTSkip("macros are only supported when running tests for the host platform")
        #endif
    }

    func testAttachedMacroWithStringParameters() throws {
        #if canImport(ExpoModulesOptimizedMacros)
        assertMacroExpansion(
            """
            @OptimizedFunction("concat")
            private func concatImpl(a: String, b: String) -> String {
                return a + b
            }
            """,
            expandedSource: """
            private func concatImpl(a: String, b: String) -> String {
                return a + b
            }

            private func concat() -> AnyDefinition {
                return _createOptimizedFunction(
                    name: "concat",
                    typeEncoding: "@@?@@",
                    argsCount: 2,
                    block: (concatImpl as @convention(block) (String, String) -> String) as AnyObject
                )
            }
            """,
            macros: testMacros
        )
        #else
        throw XCTSkip("macros are only supported when running tests for the host platform")
        #endif
    }

    func testAttachedMacroWithBoolParameter() throws {
        #if canImport(ExpoModulesOptimizedMacros)
        assertMacroExpansion(
            """
            @OptimizedFunction("negate")
            private func negateImpl(value: Bool) -> Bool {
                return !value
            }
            """,
            expandedSource: """
            private func negateImpl(value: Bool) -> Bool {
                return !value
            }

            private func negate() -> AnyDefinition {
                return _createOptimizedFunction(
                    name: "negate",
                    typeEncoding: "B@?B",
                    argsCount: 1,
                    block: (negateImpl as @convention(block) (Bool) -> Bool) as AnyObject
                )
            }
            """,
            macros: testMacros
        )
        #else
        throw XCTSkip("macros are only supported when running tests for the host platform")
        #endif
    }

    func testAttachedMacroWithThrowingFunctionVoidReturn() throws {
        #if canImport(ExpoModulesOptimizedMacros)
        assertMacroExpansion(
            """
            @OptimizedFunction("validateValue")
            private func validateValueImpl(value: Double) throws {
                if value < 0 {
                    throw NSError(domain: "ValidationError", code: 1)
                }
            }
            """,
            expandedSource: """
            private func validateValueImpl(value: Double) throws {
                if value < 0 {
                    throw NSError(domain: "ValidationError", code: 1)
                }
            }

            private func validateValue() -> AnyDefinition {
                let impl: (Double) throws -> Void = validateValueImpl
                let wrapper: @convention(block) (Double) -> Void = { arg0 in
                    do {
                        try impl(arg0)
                    } catch {
                        let nsError: NSError
                        if let expoError = error as? Exception {
                            nsError = NSError(domain: "dev.expo.modules", code: 0, userInfo: [
                                "name": expoError.name,
                                "code": expoError.code,
                                "message": expoError.debugDescription,
                            ])
                        } else {
                            nsError = error as NSError
                        }
                        let exception = NSException(
                            name: NSExceptionName(nsError.userInfo["name"] as? String ?? "SwiftError"),
                            reason: nsError.userInfo["message"] as? String ?? nsError.localizedDescription,
                            userInfo: nsError.userInfo
                        )
                        exception.raise()
                    }
                }
                return _createOptimizedFunction(
                    name: "validateValue",
                    typeEncoding: "v@?d",
                    argsCount: 1,
                    block: wrapper as AnyObject
                )
            }
            """,
            macros: testMacros
        )
        #else
        throw XCTSkip("macros are only supported when running tests for the host platform")
        #endif
    }

    func testAttachedMacroWithThrowingFunctionWithReturn() throws {
        #if canImport(ExpoModulesOptimizedMacros)
        assertMacroExpansion(
            """
            @OptimizedFunction("divide")
            private func divideImpl(a: Double, b: Double) throws -> Double {
                if b == 0 {
                    throw NSError(domain: "MathError", code: 1)
                }
                return a / b
            }
            """,
            expandedSource: """
            private func divideImpl(a: Double, b: Double) throws -> Double {
                if b == 0 {
                    throw NSError(domain: "MathError", code: 1)
                }
                return a / b
            }

            private func divide() -> AnyDefinition {
                let impl: (Double, Double) throws -> Double = divideImpl
                let wrapper: @convention(block) (Double, Double) -> Double = { arg0, arg1 in
                    do {
                        return try impl(arg0, arg1)
                    } catch {
                        let nsError: NSError
                        if let expoError = error as? Exception {
                            nsError = NSError(domain: "dev.expo.modules", code: 0, userInfo: [
                                "name": expoError.name,
                                "code": expoError.code,
                                "message": expoError.debugDescription,
                            ])
                        } else {
                            nsError = error as NSError
                        }
                        let exception = NSException(
                            name: NSExceptionName(nsError.userInfo["name"] as? String ?? "SwiftError"),
                            reason: nsError.userInfo["message"] as? String ?? nsError.localizedDescription,
                            userInfo: nsError.userInfo
                        )
                        exception.raise()
                        fatalError("Unreachable")
                    }
                }
                return _createOptimizedFunction(
                    name: "divide",
                    typeEncoding: "d@?dd",
                    argsCount: 2,
                    block: wrapper as AnyObject
                )
            }
            """,
            macros: testMacros
        )
        #else
        throw XCTSkip("macros are only supported when running tests for the host platform")
        #endif
    }

    func testAttachedMacroWithThrowingFunctionNoParams() throws {
        #if canImport(ExpoModulesOptimizedMacros)
        assertMacroExpansion(
            """
            @OptimizedFunction("getConfig")
            private func getConfigImpl() throws -> String {
                throw NSError(domain: "ConfigError", code: 404)
            }
            """,
            expandedSource: """
            private func getConfigImpl() throws -> String {
                throw NSError(domain: "ConfigError", code: 404)
            }

            private func getConfig() -> AnyDefinition {
                let impl: () throws -> String = getConfigImpl
                let wrapper: @convention(block) () -> String = {
                    do {
                        return try impl()
                    } catch {
                        let nsError: NSError
                        if let expoError = error as? Exception {
                            nsError = NSError(domain: "dev.expo.modules", code: 0, userInfo: [
                                "name": expoError.name,
                                "code": expoError.code,
                                "message": expoError.debugDescription,
                            ])
                        } else {
                            nsError = error as NSError
                        }
                        let exception = NSException(
                            name: NSExceptionName(nsError.userInfo["name"] as? String ?? "SwiftError"),
                            reason: nsError.userInfo["message"] as? String ?? nsError.localizedDescription,
                            userInfo: nsError.userInfo
                        )
                        exception.raise()
                        fatalError("Unreachable")
                    }
                }
                return _createOptimizedFunction(
                    name: "getConfig",
                    typeEncoding: "@@?",
                    argsCount: 0,
                    block: wrapper as AnyObject
                )
            }
            """,
            macros: testMacros
        )
        #else
        throw XCTSkip("macros are only supported when running tests for the host platform")
        #endif
    }
}
