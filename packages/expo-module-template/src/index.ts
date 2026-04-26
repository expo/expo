// Reexport the native module. On web, it will be resolved to <%- project.moduleName %>.web.ts
// and on native platforms to <%- project.moduleName %>.ts
export { default } from './<%- project.moduleName %>';
<% if (project.features.includes('View')) { -%>
export { default as <%- project.viewName %> } from './<%- project.viewName %>';
<% } -%>
export * from './<%- project.name %>.types';
<% if (project.features.includes('SharedObject')) { -%>
export * from './<%- project.sharedObjectName %>';
<% } -%>
