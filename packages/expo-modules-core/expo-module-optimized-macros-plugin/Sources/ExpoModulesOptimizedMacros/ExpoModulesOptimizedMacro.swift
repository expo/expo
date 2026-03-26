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

/// Implementation of the `@OptimizedFunction` attached macro.
/// Generates a peer function that returns `OptimizedFunctionDescriptor` for use with
/// the `Function("name", descriptor)` overload.
///
/// Usage:
///
///     @OptimizedFunction
///     private func addNumbers(a: Double, b: Double) -> Double {
///         return a + b
///     }
///
/// generates a peer function:
///
///     private func addNumbers() -> OptimizedFunctionDescriptor {
///         return _createOptimizedFunctionDescriptor(
///             typeEncoding: "d@?dd",
///             argsCount: 2,
///             block: (addNumbers as @convention(block) (Double, Double) -> Double) as AnyObject
///         )
///     }
///
/// Then use in definition(): `Function("addNumbers", addNumbers())`
public struct OptimizedFunctionAttachedMacro: PeerMacro {
    public static func expansion(
        of node: AttributeSyntax,
        providingPeersOf declaration: some DeclSyntaxProtocol,
        in context: some MacroExpansionContext
    ) throws -> [DeclSyntax] {
        guard let funcDecl = declaration.as(FunctionDeclSyntax.self) else {
            throw MacroExpansionErrorMessage("@OptimizedFunction can only be attached to function declarations")
        }

        // Extract the function name from the macro argument, or default to the Swift function name
        let functionName: String
        if case let .argumentList(arguments) = node.arguments,
           let firstArg = arguments.first,
           let nameExpr = firstArg.expression.as(StringLiteralExprSyntax.self),
           let nameSegment = nameExpr.segments.first?.as(StringSegmentSyntax.self) {
            functionName = nameSegment.content.text
        } else {
            functionName = funcDecl.name.text
        }

        var paramTypes: [String] = []
        for param in funcDecl.signature.parameterClause.parameters {
            paramTypes.append(param.type.trimmedDescription)
        }

        let returnType = funcDecl.signature.returnClause?.type.trimmedDescription ?? "Void"
        let functionThrows = funcDecl.signature.effectSpecifiers?.throwsClause?.throwsSpecifier != nil
        let typeEncoding = try generateTypeEncoding(returnType: returnType, paramTypes: paramTypes)
        let implFuncName = funcDecl.name.text
        let blockParamTypes = paramTypes.joined(separator: ", ")
        let argNames = (0..<paramTypes.count).map { "arg\($0)" }.joined(separator: ", ")

        let peerFunc: DeclSyntax

        if functionThrows {
            let isVoid = returnType == "Void" || returnType == "()"
            let implType = paramTypes.isEmpty ? "() throws -> \(returnType)" : "(\(blockParamTypes)) throws -> \(returnType)"
            let wrapperType = paramTypes.isEmpty ? "@convention(block) () -> \(returnType)" : "@convention(block) (\(blockParamTypes)) -> \(returnType)"
            let closureArgs = paramTypes.isEmpty ? "" : " \(argNames) in"
            let implCall = paramTypes.isEmpty ? "impl()" : "impl(\(argNames))"
            let tryExpr = isVoid ? "try \(implCall)" : "return try \(implCall)"
            let unreachable = isVoid ? "" : "\n            fatalError(\"Unreachable\")"

            peerFunc = """
            private func \(raw: functionName)() -> OptimizedFunctionDescriptor {
                let impl: \(raw: implType) = \(raw: implFuncName)
                let wrapper: \(raw: wrapperType) = {\(raw: closureArgs)
                    do {
                        \(raw: tryExpr)
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
                        exception.raise()\(raw: unreachable)
                    }
                }
                return _createOptimizedFunctionDescriptor(
                    typeEncoding: "\(raw: typeEncoding)",
                    argsCount: \(raw: String(paramTypes.count)),
                    block: wrapper as AnyObject
                )
            }
            """
        } else {
            peerFunc = """
            private func \(raw: functionName)() -> OptimizedFunctionDescriptor {
                return _createOptimizedFunctionDescriptor(
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
