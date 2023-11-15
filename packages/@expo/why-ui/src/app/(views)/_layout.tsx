import { Link, Slot, Tabs } from 'expo-router';
import { FilteredModulesContext, useGraph } from '../../components/deps-context';
import React from 'react';
import Checkbox from 'expo-checkbox';
import { Button } from '@/components/ui/button';

export default function Layout() {
  const { modules, absoluteEntryFilePath, options } = useGraph();

  const [showNodeModules, setShowNodeModules] = React.useState(true);
  const [showVirtual, setShowVirtual] = React.useState(false);

  const visibleDeps = React.useMemo(() => {
    const root = options.projectRoot;

    return modules.map((m) => {
      const absolutePath = root + '/' + m.path;
      const isEntry = absoluteEntryFilePath === absolutePath;
      return {
        ...m,
        id: m.path,
        absolutePath,
        isEntry,
      };
    });
    // return modules.filter((dep) => {
    //   if (!showNodeModules && dep.path.includes('node_modules')) {
    //     return false;
    //   }
    //   if (!showVirtual && dep.output[0].type === 'js/script/virtual') {
    //     return false;
    //   }
    //   return true;
    // });
  }, [options, modules, showNodeModules, showVirtual]);

  return (
    <FilteredModulesContext.Provider value={visibleDeps}>
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex p-3 gap-2 border-b border-b-[#ffffff1a] flex-col justify-between flex-wrap">
          <div className="flex-row">
            <h3 className="text-slate-50 font-bold">Expo JS Bundle</h3>
            <div className="flex-col">
              <div className="flex items-center flex-row gap-2 justify-center ">
                <Checkbox value={showNodeModules} onValueChange={setShowNodeModules} />
                <p className="text-slate-50">node_modules</p>
              </div>
              <div className="flex items-center flex-row gap-2 justify-center ">
                <Checkbox value={showVirtual} onValueChange={setShowVirtual} />
                <p className="text-slate-50">virtual</p>
              </div>
            </div>
          </div>

          <div className="flex-col">
            <Link href="/">
              <p className="text-slate-300">List</p>
            </Link>
            <Link href="/graph">
              <p className="text-slate-300">Graph</p>
            </Link>
          </div>
        </div>
        <div className="relative flex flex-1">
          <Slot />
        </div>
      </div>
    </FilteredModulesContext.Provider>
  );
}
