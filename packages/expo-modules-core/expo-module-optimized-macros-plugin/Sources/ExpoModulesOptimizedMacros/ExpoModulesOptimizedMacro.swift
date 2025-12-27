import SwiftCompilerPlugin
import SwiftSyntax
import SwiftSyntaxBuilder
import SwiftSyntaxMacros

/// Implementation of the `@OptimizedFunction` macro, which generates an optimized
/// version of a function as a peer declaration. The generated function has the
/// prefix `_optimized_` and calls the original function, wrapping the result.
///
/// For example:
///
///     @OptimizedFunction
///     func getValue() -> String {
///         return "test"
///     }
///
/// will generate:
///
///     func _optimized_getValue() -> String {
///         let result = getValue()
///         return result
///     }
public struct OptimizedFunctionMacro: PeerMacro {
    public static func expansion(
        of node: AttributeSyntax,
        providingPeersOf declaration: some DeclSyntaxProtocol,
        in context: some MacroExpansionContext
    ) throws -> [DeclSyntax] {
        guard let funcDecl = declaration.as(FunctionDeclSyntax.self) else {
            throw MacroExpansionErrorMessage("@OptimizedFunction can only be applied to functions")
        }

        let funcName = funcDecl.name.text
        let optimizedName = "_optimized_\(funcName)"

        let genericParams = funcDecl.genericParameterClause
        let parameters = funcDecl.signature.parameterClause
        let returnClause = funcDecl.signature.returnClause

        // Build the argument list for calling the original function
        let argumentList = parameters.parameters.map { param in
            let firstName = param.firstName.text
            let secondName = param.secondName?.text

            if firstName == "_" {
                // No external label, use internal name only
                return secondName ?? ""
            } else if let secondName = secondName {
                // Has both external and internal names
                return "\(firstName): \(secondName)"
            } else {
                // Only one name, use it as both label and value
                return "\(firstName): \(firstName)"
            }
        }.joined(separator: ", ")

        let optimizedFunc: DeclSyntax

        if let returnClause = returnClause {
            // Function has a return value
            if let genericParams = genericParams {
                optimizedFunc =
                    """
                    func \(raw: optimizedName)\(genericParams)\(parameters)\(returnClause.trimmed) {
                        let result = \(raw: funcName)(\(raw: argumentList))
                        return result
                    }
                    """
            } else {
                optimizedFunc =
                    """
                    func \(raw: optimizedName)\(parameters)\(returnClause.trimmed) {
                        let result = \(raw: funcName)(\(raw: argumentList))
                        return result
                    }
                    """
            }
        } else {
            // Function returns Void
            if let genericParams = genericParams {
                optimizedFunc =
                    """
                    func \(raw: optimizedName)\(genericParams)\(parameters.trimmed) {
                        \(raw: funcName)(\(raw: argumentList))
                    }
                    """
            } else {
                optimizedFunc =
                    """
                    func \(raw: optimizedName)\(parameters.trimmed) {
                        \(raw: funcName)(\(raw: argumentList))
                    }
                    """
            }
        }

        return [optimizedFunc]
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
        OptimizedFunctionMacro.self,
    ]
}
