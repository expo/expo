import ExpoModulesCore

public class <%- project.moduleName %>: Module {
  public func definition() -> ModuleDefinition {
    Name("<%- project.name %>")
<% if (moduleSnippetsSwift.trim()) { -%>

<%- moduleSnippetsSwift %>
<% } -%>
  }
}
