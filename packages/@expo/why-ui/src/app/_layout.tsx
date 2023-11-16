import { Slot } from 'expo-router';
import React from 'react';

import { GraphProvider } from '@/components/deps-context';
import { CliDataProvider, ExpoServerResponse, useFetchedServerData } from '@/components/data';

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

function LoadedLayout() {
  const { status, data, error, isFetching } = useFetchedServerData();
  // console.log('status, data, error, isFetching', status, data, error, isFetching);

  if (isFetching) {
    return <h1 className="text-slate-200">Loading...</h1>;
  }
  if (!data) {
    return <h1 className="text-slate-200">No data, perform a build and reload...</h1>;
  }

  // const data = require('fixture.json');
  return <LoadedLayoutInner data={data} />;
}

function LoadedLayoutInner({ data }: { data: ExpoServerResponse }) {
  const latest = data.graphs[data.graphs.length - 1];
  const deps = React.useMemo(() => {
    return [...latest[1], ...latest[2].dependencies].map((dep, index) => ({
      ...dep,
      index,
      duration: dep.output[0]?.data?.profiling?.duration ?? -1,
    }));
  }, [latest]);

  return (
    <GraphProvider value={{ modules: deps, options: latest[3], absoluteEntryFilePath: latest[0] }}>
      <Slot />
    </GraphProvider>
  );
}
