import React from 'react';

import { MetroJsonModule } from './data';

export const graphContext = React.createContext<{
  absoluteEntryFilePath: string;
  modules: MetroJsonModule[];
  transformOptions: {
    platform: string;
  };
  options: {
    serverRoot?: string;
    projectRoot: string;

    /** "/Users/evanbacon/Documents/GitHub/expo/node_modules/metro-runtime/src/modules/asyncRequire.js" */
    asyncRequireModulePath: string;
    includeAsyncPaths: boolean;
    dev: boolean;
    modulesOnly?: boolean;
    runBeforeMainModule: string[];
    runModule?: boolean;
    sourceMapUrl?: string;
    sourceUrl?: string;
    inlineSourceMap?: boolean;
  };
}>(null);

export function GraphProvider({ children, value }) {
  return <graphContext.Provider value={value}>{children}</graphContext.Provider>;
}
export function useGraph() {
  return React.useContext(graphContext);
}

export const FilteredModulesContext = React.createContext<MetroJsonModule[]>([]);

export function useFilteredModules() {
  return React.useContext(FilteredModulesContext);
}
