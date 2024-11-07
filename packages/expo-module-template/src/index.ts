// Reexport the native module. On web, it will be resolved to <%- project.moduleName %>.web.ts
// and on native platforms to <%- project.moduleName %>.ts
export { default } from './<%- project.moduleName %>';
export { default as <%- project.viewName %> } from './<%- project.viewName %>';
export * from  './<%- project.name %>.types';
