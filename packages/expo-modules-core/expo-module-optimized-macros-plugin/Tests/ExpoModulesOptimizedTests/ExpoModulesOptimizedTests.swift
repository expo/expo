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
}
