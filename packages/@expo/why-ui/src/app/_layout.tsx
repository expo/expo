import { Link, Slot } from 'expo-router';
import React from 'react';

import { GraphProvider } from '@/components/deps-context';
import {
  CliDataProvider,
  ExpoServerResponse,
  JsonGraph,
  useFetchedServerData,
} from '@/components/data';

import '@/global.css';

export default function Layout() {
  // const fixture = useFetchedServerData();
  // if (!fixture) {
  //   return null;
  // }

  console.log('Layout');

  return (
    <div className="bg-black flex flex-1 flex-col">
      <CliDataProvider>
        <LoadedLayout />
      </CliDataProvider>
    </div>
  );
}

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ServerIcon from 'lucide-react/dist/esm/icons/server';
import ComputerIcon from 'lucide-react/dist/esm/icons/laptop';
import SmartphoneIcon from 'lucide-react/dist/esm/icons/smartphone';

function LoadedLayout() {
  const { status, data, error, isFetching } = useFetchedServerData();
  const selectItems = React.useMemo(() => {
    const selectItems: {
      platformOrEnv: string;
      icon: React.ReactNode;
      items: { title: string; index: number }[];
    }[] = [];

    if (!data) return selectItems;

    const commonRoot = data.graphs
      .map((graph) => graph[0])
      .reduce((acc, path) => {
        const parts = path.split('/');
        const commonParts = acc.split('/').filter((part, index) => part === parts[index]);
        return commonParts.join('/');
      }, data.graphs[0][0]);

    data.graphs.forEach((parent, index) => {
      const options = parent[2].transformOptions;
      const relativeEntry = parent[0].replace(commonRoot, '');
      const isServer = options.customTransformOptions?.environment === 'node';
      let title = relativeEntry;

      if (isServer) {
        // The SSR renderer file.
        if (relativeEntry.endsWith('expo-router/node/render.js')) {
          title += ' [SSR]';
        }
      }

      const platformOrEnv = isServer
        ? 'Server'
        : { web: 'Web', ios: 'iOS', android: 'Android' }[options.platform] ?? options.platform;

      const items = selectItems.find((item) => item.platformOrEnv === platformOrEnv)?.items;
      if (!items) {
        selectItems.push({
          platformOrEnv,
          icon: isServer ? (
            <ServerIcon size={14} />
          ) : options.platform === 'web' ? (
            <ComputerIcon size={14} />
          ) : (
            <SmartphoneIcon size={14} />
          ),
          items: [{ title, index }],
        });
      } else {
        items.push({ title, index });
      }
    });
    return selectItems;
  }, [data]);

  // console.log('status, data, error, isFetching', status, data, error, isFetching);
  const [selected, setSelected] = React.useState<number>(0);
  if (isFetching) {
    return <h1 className="text-slate-200">Loading...</h1>;
  }
  if (!data) {
    return <h1 className="text-slate-200">No data, perform a build and reload...</h1>;
  }

  // const data = require('fixture.json');
  return (
    <div className="flex flex-1 items-stretch flex-col h-full max-h-screen overflow-y-scroll">
      <div className="flex p-2 px-4 gap-2 border-b border-b-[#ffffff1a] flex-row items-center justify-between flex-wrap">
        <Link href="/" className="flex items-center justify-between flex-row">
          <svg
            role="img"
            className="w-5 h-5 mr-2"
            style={{ fill: '#fff' }}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg">
            <title>Expo</title>
            <path d="M0 20.084c.043.53.23 1.063.718 1.778.58.849 1.576 1.315 2.303.567.49-.505 5.794-9.776 8.35-13.29a.761.761 0 011.248 0c2.556 3.514 7.86 12.785 8.35 13.29.727.748 1.723.282 2.303-.567.57-.835.728-1.42.728-2.046 0-.426-8.26-15.798-9.092-17.078-.8-1.23-1.044-1.498-2.397-1.542h-1.032c-1.353.044-1.597.311-2.398 1.542C8.267 3.991.33 18.758 0 19.77Z" />
          </svg>
          <h3 className="text-slate-50 font-bold">Unbundle</h3>
        </Link>

        {/* Footer with picker for the graph to use. */}
        {data.graphs.length > 1 && (
          <Select
            onValueChange={(value) => {
              setSelected(Number(value));
            }}>
            <SelectTrigger className="max-w-[280px]">
              <SelectValue placeholder="Select a bundle" />
            </SelectTrigger>
            <SelectContent>
              {selectItems.map(({ platformOrEnv, icon, items }) => (
                <SelectGroup key={platformOrEnv}>
                  <SelectLabel className="flex flex-row items-center gap-2">
                    {icon} {platformOrEnv}
                  </SelectLabel>
                  {items.map(({ title, index }) => (
                    <SelectItem key={index} value={String(index)}>
                      {title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <LoadedLayoutInner data={data.graphs[selected]} />
    </div>
  );
}

function LoadedLayoutInner({ data: latest }: { data: JsonGraph }) {
  // const latest = data.graphs[data.graphs.length - 1];

  const deps = React.useMemo(() => {
    return [...latest[1], ...latest[2].dependencies].map((dep, index) => ({
      ...dep,
      index,
      duration: dep.output[0]?.data?.profiling?.duration ?? -1,
    }));
  }, [latest]);

  return (
    <GraphProvider
      value={{
        modules: deps,
        options: latest[3],
        transformOptions: latest[2].transformOptions,
        absoluteEntryFilePath: latest[0],
      }}>
      <Slot />
    </GraphProvider>
  );
}
