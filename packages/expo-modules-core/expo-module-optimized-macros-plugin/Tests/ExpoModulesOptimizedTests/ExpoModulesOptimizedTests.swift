import SwiftSyntax
import SwiftSyntaxBuilder
import SwiftSyntaxMacros
import SwiftSyntaxMacrosTestSupport
import XCTest

// Macro implementations build for the host, so the corresponding module is not available when cross-compiling. Cross-compiled tests may still make use of the macro itself in end-to-end tests.
#if canImport(ExpoModulesOptimizedMacros)
import ExpoModulesOptimizedMacros

let testMacros: [String: Macro.Type] = [
    "OptimizedFunction": OptimizedFunctionMacro.self,
]
#endif

final class ExpoModulesOptimizedTests: XCTestCase {
    func testOptimizedFunctionWithSimpleFunction() throws {
        #if canImport(ExpoModulesOptimizedMacros)
        assertMacroExpansion(
            """
            @OptimizedFunction
            func calculateSum(_ a: Int, _ b: Int) -> Int {
                return a + b
            }
            """,
            expandedSource: """
            func calculateSum(_ a: Int, _ b: Int) -> Int {
                return a + b
            }

            func _optimized_calculateSum(_ a: Int, _ b: Int) -> Int {
                let result = calculateSum(a, b)
                return result
            }
            """,
            macros: testMacros
        )
        #else
        throw XCTSkip("macros are only supported when running tests for the host platform")
        #endif
    }

    func testOptimizedFunctionWithNoParameters() throws {
        #if canImport(ExpoModulesOptimizedMacros)
        assertMacroExpansion(
            """
            @OptimizedFunction
            func getValue() -> String {
                return "test"
            }
            """,
            expandedSource: """
            func getValue() -> String {
                return "test"
            }

            func _optimized_getValue() -> String {
                let result = getValue()
                return result
            }
            """,
            macros: testMacros
        )
        #else
        throw XCTSkip("macros are only supported when running tests for the host platform")
        #endif
    }

    func testOptimizedFunctionWithVoidReturn() throws {
        #if canImport(ExpoModulesOptimizedMacros)
        assertMacroExpansion(
            """
            @OptimizedFunction
            func printMessage(_ message: String) {
                print(message)
            }
            """,
            expandedSource: """
            func printMessage(_ message: String) {
                print(message)
            }

            func _optimized_printMessage(_ message: String) {
                printMessage(message)
            }
            """,
            macros: testMacros
        )
        #else
        throw XCTSkip("macros are only supported when running tests for the host platform")
        #endif
    }

    func testOptimizedFunctionWithGenericParameters() throws {
        #if canImport(ExpoModulesOptimizedMacros)
        assertMacroExpansion(
            """
            @OptimizedFunction
            func identity<T>(_ value: T) -> T {
                return value
            }
            """,
            expandedSource: """
            func identity<T>(_ value: T) -> T {
                return value
            }

            func _optimized_identity<T>(_ value: T) -> T {
                let result = identity(value)
                return result
            }
            """,
            macros: testMacros
        )
        #else
        throw XCTSkip("macros are only supported when running tests for the host platform")
        #endif
    }
}
