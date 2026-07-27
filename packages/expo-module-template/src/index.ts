// Reexport the native module. On web, it will be resolved to <%- project.moduleName %>.web.ts
// and on native platforms to <%- project.moduleName %>.ts
export { default } from './<%- project.moduleName %>';
<% if (project.features.includes('View')) { -%>
export { default as <%- project.viewName %> } from './<%- project.viewName %>';
<% } -%>
<% if (project.features.includes('SwiftUIView')) { -%>
export { default as <%- project.swiftUIViewName %> } from './<%- project.swiftUIViewName %>';
<% } -%>
<% if (project.features.includes('ComposeView')) { -%>
export { default as <%- project.composeViewName %> } from './<%- project.composeViewName %>';
<% } -%>
<% if (project.features.includes('SwiftUIModifier')) { -%>
export * from './<%- project.swiftUIModifierName %>';
<% } -%>
<% if (project.features.includes('ComposeModifier')) { -%>
export * from './<%- project.composeModifierName %>';
<% } -%>
export * from './<%- project.name %>.types';
<% if (project.features.includes('SharedObject')) { -%>
export * from './<%- project.sharedObjectName %>';
<% } -%>
