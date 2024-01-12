import classNames from 'classnames';
import { Link, Navigator, Slot } from 'expo-router';
import React from 'react';

import { FilteredModulesContext, useGraph } from '@/components/deps-context';
import { Button } from '@/components/ui/button';

export const unstable_settings = {
  initialRouteName: 'graph',
};

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

const NAME_ATTRIBUTE_MAP = {
  baseUrl: 'Base URL',
  dev: 'Dev',
  engine: 'Engine',
  routerRoot: 'Router Root',
  minify: 'Minify',
  platform: 'Platform',
};

function BundleInfo() {
  const { options, transformOptions } = useGraph();

  console.log('transformOptions', transformOptions);

  const coreAttributes = {
    ...transformOptions.customTransformOptions,
    platform: transformOptions.platform,
    minify: transformOptions.minify,
    dev: options.dev,
  };

  return (
    <div>
      <span className="text-slate-50">Bundle Info</span>
      {/* Dev */}
      {Object.entries(coreAttributes).map(([key, value]) => {
        return (
          <div key={key} className="flex flex-row items-center gap-1">
            <span className="text-slate-200">{NAME_ATTRIBUTE_MAP[key] ?? key}:</span>
            <span className="text-slate-50">{String(value)}</span>
          </div>
        );
      })}
      {/* <span>Platform: {options.dev ? 'development' : "production"}</span> */}
    </div>
  );
}

function Header() {
  const homeSelected = useSelected('index');
  const treeSelected = useSelected('tree');
  return (
    <div className="flex p-1 gap-2 border-b border-b-[#ffffff1a] flex-row items-center justify-between flex-wrap">
      {/* <BundleInfo /> */}

      <div className="flex gap-2 flex-row items-center justify-between">
        <Button
          asChild
          variant="link"
          className={classNames(homeSelected ? 'font-bold underline' : '')}>
          <Link href="/">Graph</Link>
        </Button>
        <Button
          asChild
          variant="link"
          className={classNames(useSelected('profile') ? 'font-bold underline' : '')}>
          <Link href="/profile">Speed</Link>
        </Button>
        <Button
          asChild
          variant="link"
          className={classNames(treeSelected ? 'font-bold underline' : '')}>
          <Link href="/tree">Size</Link>
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
