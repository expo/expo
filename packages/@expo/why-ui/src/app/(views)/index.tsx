import React from 'react';

import { DependenciesList } from '../../components/dependencies';
import { useFilteredModules } from '../../components/deps-context';
import { DataTableDemo } from '@/components/data-table';

export default function App() {
  return (
    <DataTableDemo data={useFilteredModules()} />
    // <div className="bg-[#191A20] flex flex-1 flex-row absolute top-0 left-0 bottom-0 right-0">
    //   <div className="flex flex-1 flex-col">
    //     {/* <GraphComponent modules={visibleDeps} /> */}
    //     {/* <DependenciesList modules={modules} /> */}
    //   </div>
    // </div>
  );
}
