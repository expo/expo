import React from 'react';
import { MetroJsonModule } from './data';

export const graphContext = React.createContext<{ modules: MetroJsonModule[] }>(null);

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
