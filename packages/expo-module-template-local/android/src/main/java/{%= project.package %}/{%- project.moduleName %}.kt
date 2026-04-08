package <%- project.package %>

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
<% if (project.features.includes('View')) { %>
import java.net.URL
<% } %>
class <%- project.moduleName %> : Module() {
  override fun definition() = ModuleDefinition {
    Name("<%- project.name %>")
<%- moduleSnippetsKt %>
  }
}
