package <%- project.package %>

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class <%- project.moduleName %> : Module() {
  override fun definition() = ModuleDefinition {
    Name("<%- project.name %>")
<% if (moduleSnippetsKt.trim()) { -%>

<%- moduleSnippetsKt %>
<% } -%>
  }
}
