import ExpoModulesCore
<% if (usesSwiftUI) { -%>
import ExpoUI
<% } -%>

public class <%- project.moduleName %>: Module {
  public func definition() -> ModuleDefinition {
    Name("<%- project.name %>")
<% if (moduleSnippetsSwift.trim()) { -%>

<%- moduleSnippetsSwift %>
<% } -%>
  }
}
