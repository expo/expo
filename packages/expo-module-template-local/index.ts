// Reexport the native module. On web, it will be resolved to MyModule.web.ts
// and on native platforms to MyModule.ts
export { default } from './src/<%- project.moduleName %>';
export { default as <%- project.viewName %> } from './src/<%- project.viewName %>';
export * from  './src/<%- project.name %>.types';
