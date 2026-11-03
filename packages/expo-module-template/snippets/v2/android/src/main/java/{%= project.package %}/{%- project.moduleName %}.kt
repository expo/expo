<% const hasEvent = project.features.includes('Event'); -%>
<% const hasJSMembers = ['Constant', 'Function', 'AsyncFunction'].some((f) => project.features.includes(f)); -%>
package <%- project.package %>

<% if (hasEvent) { -%>
import io.github.expo.modules.v2.Event
<% } -%>
import io.github.expo.modules.v2.ExpoModule
<% if (hasJSMembers) { -%>
import io.github.expo.modules.v2.JS
<% } -%>
import io.github.expo.modules.v2.Module
<% if (hasEvent) { -%>
import io.github.expo.modules.v2.Record
<% } -%>

@ExpoModule("<%- project.name %>"<% if (project.features.includes('SharedObject')) { %>, classes = [<%- project.sharedObjectName %>::class]<% } %>)
class <%- project.moduleName %> : Module() {
<% if (moduleSnippetsKt.trim()) { -%>
<%- moduleSnippetsKt %>
<% } -%>
}
