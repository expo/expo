import { NativeModule, requireNativeModule } from 'expo';
<% if (project.features.includes('Event') || project.features.includes('SharedObject')) { -%>

<% } -%>
<% if (project.features.includes('Event')) { -%>
import { <%- project.moduleName %>Events } from './<%- project.name %>.types';
<% } -%>
<% if (project.features.includes('SharedObject')) { -%>
import type { <%- project.sharedObjectName %> } from './<%- project.sharedObjectName %>';
<% } -%>

declare class <%- project.moduleName %> extends NativeModule<<% if (project.features.includes('Event')) { %><%- project.moduleName %>Events<% } else { %>{}<% } %>><% if (['Constant', 'Function', 'AsyncFunction', 'SharedObject'].some((f) => project.features.includes(f))) { %> {
<% if (project.features.includes('Constant')) { -%>
  PI: number;
<% } -%>
<% if (project.features.includes('Function')) { -%>
  hello(): string;
<% } -%>
<% if (project.features.includes('AsyncFunction')) { -%>
  setValueAsync(value: string): Promise<void>;
<% } -%>
<% if (project.features.includes('SharedObject')) { -%>
  <%- project.sharedObjectName %>: typeof <%- project.sharedObjectName %>;
<% } -%>
}<% } else { %> {}<% } %>

export default requireNativeModule<<%- project.moduleName %>>('<%- project.name %>');
