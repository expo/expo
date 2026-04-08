<% if (project.platforms.includes('web')) { -%>
import { registerWebModule, NativeModule } from 'expo';
<%- webEventImport %>
class <%- project.moduleName %> extends NativeModule<<%- webEventType %>><% if (webModuleSnippets) { %> {
<%- webModuleSnippets %>}<% } else { %> {}<% } %>

export default registerWebModule(<%- project.moduleName %>, '<%- project.moduleName %>');
<% } else { -%>
import { registerWebModule, NativeModule } from 'expo';
<%- webEventImport %>
// <%- project.moduleName %> is not available on the web platform.
class <%- project.moduleName %> extends NativeModule<<%- webEventType %>> {}

export default registerWebModule(<%- project.moduleName %>, '<%- project.moduleName %>');
<% } -%>
