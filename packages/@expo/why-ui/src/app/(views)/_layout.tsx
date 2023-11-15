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
        isNodeModule: m.path.includes('node_modules'),
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
        <div className="flex p-4 gap-2 border-b border-b-[#ffffff1a] flex-col justify-between flex-wrap">
          <div className="flex-row">
            <span className="flex flex-row">
              <svg
                role="img"
                className="w-6 h-6 mr-2"
                style={{ fill: '#fff' }}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg">
                <title>Expo</title>
                <path d="M0 20.084c.043.53.23 1.063.718 1.778.58.849 1.576 1.315 2.303.567.49-.505 5.794-9.776 8.35-13.29a.761.761 0 011.248 0c2.556 3.514 7.86 12.785 8.35 13.29.727.748 1.723.282 2.303-.567.57-.835.728-1.42.728-2.046 0-.426-8.26-15.798-9.092-17.078-.8-1.23-1.044-1.498-2.397-1.542h-1.032c-1.353.044-1.597.311-2.398 1.542C8.267 3.991.33 18.758 0 19.77Z" />
              </svg>
              <h3 className="text-slate-50 font-bold">Expo Why?</h3>
            </span>
          </div>
        </div>
        <div className="relative flex flex-1">
          <Slot />
        </div>
      </div>
    </FilteredModulesContext.Provider>
  );
}
