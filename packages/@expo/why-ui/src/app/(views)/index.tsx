import React from 'react';

import { DependenciesList } from '../../components/dependencies';
import { useFilteredModules } from '../../components/deps-context';

export default function App() {
  const modules = useFilteredModules();
  return (
    <div className="bg-[#191A20] flex flex-1 flex-row absolute top-0 left-0 bottom-0 right-0">
      <div className="flex flex-1 flex-col">
        {/* <GraphComponent modules={visibleDeps} /> */}
        <DependenciesList modules={modules} />
      </div>
    </div>
  );
}
