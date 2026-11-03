import ExpoModulesCore
<% if (usesSwiftUI) { -%>
import ExpoUI
<% } -%>

<% if (project.modulesApi === 'v2') { -%>
// Expo Modules API 2.0 doesn't support views yet, so this module defines the views and view
// modifiers with the Module DSL.
<% } -%>
public class <%- project.moduleName %>: Module {
  public func definition() -> ModuleDefinition {
    Name("<%- project.name %>")
<% if (moduleSnippetsSwift.trim()) { -%>

<%- moduleSnippetsSwift %>
<% } -%>
  }
}
