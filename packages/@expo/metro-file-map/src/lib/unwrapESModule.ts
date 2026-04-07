export function unwrapESModuleDefault<T = any>(mod: any): T {
  const _default = mod.__esModule === true && mod.default !== undefined ? mod.default : mod;
  return _default;
}
