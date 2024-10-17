// Reexport the native module. On web, it will be resolved to MyModule.web.ts
// and on native platforms to MyModule.ts
export { default } from './<%- project.moduleName %>';
export { default as <%- project.viewName %> } from './<%- project.viewName %>';
export * from  './<%- project.name %>.types';
