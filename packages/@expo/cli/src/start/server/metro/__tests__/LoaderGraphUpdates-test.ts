import type { GraphRevision } from '@expo/metro/metro/IncrementalBundler';
import type MetroServer from '@expo/metro/metro/Server';
import { EventEmitter } from 'node:events';

import { LoaderGraphUpdates } from '../LoaderGraphUpdates';

it('finishes invalidation across loader graphs before returning a requested bundle', async () => {
  const events = new EventEmitter();
  const order: string[] = [];
  let finishSlowGraph!: () => void;
  const slowGraph = new Promise<void>((resolve) => {
    finishSlowGraph = resolve;
  });
  const bundler = {
    getDeltaBundler: () => ({
      listen: (_graph: unknown, callback: () => void) => {
        events.on('change', callback);
        return () => events.off('change', callback);
      },
    }),
    updateGraph: jest.fn(async (revision: GraphRevision) => {
      if (revision.graphId === 'slow') await slowGraph;
      return {
        revision,
        delta: { added: new Map(), modified: new Map([['shared', {}]]), deleted: new Set() },
      };
    }),
  };
  const updates = new LoaderGraphUpdates(
    { getBundler: () => bundler } as unknown as MetroServer,
    () => order.push('invalidate')
  );
  const watch = (path: string) => {
    updates.loaderRouteFiles.add(path);
    return updates.watch(
      { graphId: path, graph: { entryPoints: [path] } } as unknown as GraphRevision,
      path
    );
  };
  const requestFastGraph = watch('fast');
  watch('slow');

  events.emit('change');
  const request = requestFastGraph().then(() => order.push('request'));
  await new Promise<void>((resolve) => setImmediate(resolve));
  finishSlowGraph();
  await request;

  expect(bundler.updateGraph).toHaveBeenCalledTimes(2);
  expect(order).toEqual(['invalidate', 'request']);
});
