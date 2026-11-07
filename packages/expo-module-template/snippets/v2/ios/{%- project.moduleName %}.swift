import ExpoModulesCore

@ExpoModule("<%- project.name %>"<% if (project.features.includes('SharedObject')) { %>, classes: [<%- project.sharedObjectName %>.self]<% } %>)
public class <%- project.moduleName %>: Module {
<% if (moduleSnippetsSwift.trim()) { -%>
<%- moduleSnippetsSwift %>
<% } -%>
}
