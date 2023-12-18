import { useMemo } from 'react';

import { useGraph } from '@/components/deps-context';
import { Profiler } from '@/components/profiler';

export default function Route() {
  const { modules } = useGraph();

  const absoluteTime = useMemo(() => {
    return modules.reduce((acc, m) => acc + (m.output[0]?.data.profiling?.duration ?? 0), 0);
  }, [modules]);

  return (
    <div className="flex flex-1 flex-col">
      <Profiler />
      <div className="flex p-4 flex-row items-center justify-between">
        <h1 className="text-md text-slate-500">Absolute time: {absoluteTime}ms</h1>
      </div>
    </div>
  );
}
