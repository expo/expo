/**
 A result builder for the view elements such as prop setters or view events.
 */
@resultBuilder
public struct PermissionDefinitionBuilder {
  public static func buildBlock(_ elements: AnyPermissionDefinitionElement...) -> [AnyPermissionDefinitionElement] {
    return elements
  }
}
