import classNames from 'classnames';
import { Link, Navigator, Slot } from 'expo-router';
import React from 'react';

import { FilteredModulesContext, useGraph } from '@/components/deps-context';
import { Button } from '@/components/ui/button';

export default function Layout() {
  const { modules, options } = useGraph();

  console.log(
    'total time:',
    modules.reduce((acc, m) => acc + (m.output[0]?.data.profiling?.duration ?? 0), 0)
  );
  const visibleDeps = React.useMemo(() => {
    return modules.map((m) => {
      return {
        ...m,
        id: m.path,
      };
    });
  }, [options, modules]);

  return (
    <FilteredModulesContext.Provider value={visibleDeps}>
      <Navigator>
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <Header />
          <div className="relative flex flex-1">
            <Slot />
          </div>
        </div>
      </Navigator>
    </FilteredModulesContext.Provider>
  );
}
function Header() {
  const homeSelected = useSelected('index');
  const treeSelected = useSelected('tree');
  return (
    <div className="flex p-4 gap-2 border-b border-b-[#ffffff1a] flex-row items-center justify-between flex-wrap">
      <Link href="/" className="flex items-center justify-between flex-row">
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
      </Link>

      <div className="flex gap-2 flex-row items-center justify-between">
        <Button
          asChild
          variant="link"
          className={classNames(homeSelected ? 'font-bold underline' : '')}>
          <Link href="/">Home</Link>
        </Button>
        <Button
          asChild
          variant="link"
          className={classNames(treeSelected ? 'font-bold underline' : '')}>
          <Link href="/tree">Tree</Link>
        </Button>
      </div>
    </div>
  );
}

function useSelected(name: string) {
  const { state } = Navigator.useContext();
  const selected = state.routes.findIndex((r) => r.name === name);
  return selected === state.index;
}
