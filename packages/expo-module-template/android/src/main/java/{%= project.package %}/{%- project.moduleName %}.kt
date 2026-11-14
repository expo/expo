package <%- project.package %>

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
<% if (project.features.includes('ComposeView')) { -%>
import expo.modules.ui.ExpoUIView
<% } -%>
<% if (project.features.includes('ComposeModifier')) { -%>
import expo.modules.kotlin.records.recordFromMap
import expo.modules.ui.ModifierRegistry
<% } -%>

<% if (project.modulesApi === 'v2') { -%>
// Expo Modules API 2.0 doesn't support views yet, so this module defines the views and view
// modifiers with the Module DSL.
<% } -%>
class <%- project.moduleName %> : Module() {
  override fun definition() = ModuleDefinition {
    Name("<%- project.name %>")
<% if (moduleSnippetsKt.trim()) { -%>

<%- moduleSnippetsKt %>
<% } -%>
  }
}
