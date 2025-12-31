import SwiftCompilerPlugin
import SwiftSyntax
import SwiftSyntaxBuilder
import SwiftSyntaxMacros
import Foundation

// MARK: - Helper Functions

/// Generates Objective-C type encoding string for the given signature
internal func generateTypeEncoding(returnType: String, paramTypes: [String]) throws -> String {
    var encoding = ""

    // Encode return type
    guard let returnEncoding = typeToEncoding(returnType) else {
        throw MacroExpansionErrorMessage("Unsupported return type: \(returnType)")
    }
    encoding += returnEncoding

    // Add block marker
    encoding += "@?"

    // Encode parameters
    for paramType in paramTypes {
        guard let paramEncoding = typeToEncoding(paramType) else {
            throw MacroExpansionErrorMessage("Unsupported parameter type: \(paramType)")
        }
        encoding += paramEncoding
    }

    return encoding
}

/// Maps Swift type to Objective-C type encoding character
internal func typeToEncoding(_ type: String) -> String? {
    switch type {
    case "Double":
        return "d"
    case "Int", "Int64":
        return "q"
    case "String":
        return "@"
    case "Bool":
        return "B"
    case "Void", "()":
        return "v"
    default:
        return nil
    }
}

// MARK: - Macro Implementation

/// Implementation of the `@OptimizedFunction` attached macro (Solution 3).
/// Generates a peer function that returns AnyDefinition for use in result builders.
///
/// For example:
///
///     @OptimizedFunction("addNumbers")
///     private func addNumbersImpl(a: Double, b: Double) -> Double {
///         return a + b
///     }
///
/// generates a peer function:
///
///     private func addNumbers() -> AnyDefinition {
///         return _createOptimizedFunction(
///             name: "addNumbers",
///             typeEncoding: "d@?dd",
///             argsCount: 2,
///             block: (addNumbersImpl as @convention(block) (Double, Double) -> Double) as AnyObject
///         )
///     }
public struct OptimizedFunctionAttachedMacro: PeerMacro {
    public static func expansion(
        of node: AttributeSyntax,
        providingPeersOf declaration: some DeclSyntaxProtocol,
        in context: some MacroExpansionContext
    ) throws -> [DeclSyntax] {
        // Ensure this is attached to a function
        guard let funcDecl = declaration.as(FunctionDeclSyntax.self) else {
            throw MacroExpansionErrorMessage("@OptimizedFunction can only be attached to function declarations")
        }

        // Extract the function name from the macro argument
        guard case let .argumentList(arguments) = node.arguments,
              let firstArg = arguments.first,
              let nameExpr = firstArg.expression.as(StringLiteralExprSyntax.self),
              let nameSegment = nameExpr.segments.first?.as(StringSegmentSyntax.self) else {
            throw MacroExpansionErrorMessage("@OptimizedFunction requires a string literal name argument")
        }
        let functionName = nameSegment.content.text

        // Extract parameter types and names from the function signature
        var paramTypes: [String] = []

        for param in funcDecl.signature.parameterClause.parameters {
            let type = param.type
            paramTypes.append(type.trimmedDescription)
        }

        // Extract return type
        let returnType: String
        if let returnClause = funcDecl.signature.returnClause {
            returnType = returnClause.type.trimmedDescription
        } else {
            // No return type means Void
            returnType = "Void"
        }

        // Generate type encoding
        let typeEncoding = try generateTypeEncoding(returnType: returnType, paramTypes: paramTypes)

        // Generate parameter list for block signature (type-only, no labels)
        let blockParamTypes = paramTypes.joined(separator: ", ")

        // Get the implementation function name
        let implFuncName = funcDecl.name.text

        // Generate the peer function name (same as the exported name)
        let peerFuncName = functionName

        // Generate the peer function
        let peerFunc: DeclSyntax

        if returnType == "Void" || returnType == "()" {
            peerFunc = """
            private func \(raw: peerFuncName)() -> AnyDefinition {
                return _createOptimizedFunction(
                    name: "\(raw: functionName)",
                    typeEncoding: "\(raw: typeEncoding)",
                    argsCount: \(raw: String(paramTypes.count)),
                    block: (\(raw: implFuncName) as @convention(block) (\(raw: blockParamTypes)) -> \(raw: returnType)) as AnyObject
                )
            }
            """
        } else {
            peerFunc = """
            private func \(raw: peerFuncName)() -> AnyDefinition {
                return _createOptimizedFunction(
                    name: "\(raw: functionName)",
                    typeEncoding: "\(raw: typeEncoding)",
                    argsCount: \(raw: String(paramTypes.count)),
                    block: (\(raw: implFuncName) as @convention(block) (\(raw: blockParamTypes)) -> \(raw: returnType)) as AnyObject
                )
            }
            """
        }

        return [peerFunc]
    }
}

struct MacroExpansionErrorMessage: Error, CustomStringConvertible {
    let message: String

    init(_ message: String) {
        self.message = message
    }

    var description: String {
        return message
    }
}

@main
struct ExpoModulesOptimizedPlugin: CompilerPlugin {
    let providingMacros: [Macro.Type] = [
        OptimizedFunctionAttachedMacro.self,
    ]
}
