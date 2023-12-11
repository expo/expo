declare module 'metro-transform-plugins' {
  import { File } from '@babel/types';
  import { PluginObj } from '@babel/core';
  export function addParamsToDefineCall(code: string, ...params: any[]): string;
  export function importExportPlugin(): PluginObj;
  export function inlineRequiresPlugin(): PluginObj;
  export function inlinePlugin(): PluginObj;
  export function constantFoldingPlugin(): PluginObj;
  export function getTransformPluginCacheKeyFiles(): string[];

  export function normalizePseudoGlobals(
    ast: File,
    options?: { reservedNames: readonly string[] }
  ): readonly string[];
}
