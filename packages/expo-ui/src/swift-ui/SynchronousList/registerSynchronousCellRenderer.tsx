import * as React from 'react';

type Renderer = (index: number) => React.ReactElement;
type FabricRenderer = {
  render: (
    element: React.ReactElement,
    rootTag: number,
    callback: () => void,
    concurrentRoot: boolean,
    options: null
  ) => void;
  unmountComponentAtNode: (rootTag: number) => void;
};

type SyncRowGlobal = typeof globalThis & {
  __ExpoUISyncRowRegistry?: Map<string, Renderer>;
  __ExpoUISyncRowNextId?: number;
  __ExpoUIRenderSyncRow?: (rendererId: string, rootTag: number, index: number) => boolean;
  __ExpoUIUnmountSyncRow?: (rootTag: number) => void;
};

/**
 * Internal registration owned by SynchronousList. Uses RNTester's legacy Fabric root
 * rendering path. Register/update after React commits, and dispose after list unmount.
 * Independent row roots don't inherit parent context and must commit without suspending.
 */
export function registerSynchronousCellRenderer(render: Renderer): {
  rendererId: string;
  dispose: () => void;
  update: (render: Renderer) => void;
} {
  const globals = globalThis as SyncRowGlobal;
  const registry = (globals.__ExpoUISyncRowRegistry ??= new Map());
  // Keep the counter and registry through Fast Refresh so IDs cannot collide.
  const rendererId = `sync-row-${(globals.__ExpoUISyncRowNextId =
    (globals.__ExpoUISyncRowNextId ?? 0) + 1)}`;
  registry.set(rendererId, render);

  // Load the private renderer only when opting into this experiment.
  const fabric: FabricRenderer =
    require('react-native/Libraries/Renderer/shims/ReactFabric').default;
  globals.__ExpoUIRenderSyncRow = (id, rootTag, index) => {
    const renderer = registry.get(id);
    if (!renderer) {
      throw new Error(`Synchronous cell renderer ${id} is no longer registered`);
    }
    let committed = false;
    fabric.render(
      <React.Fragment key={id}>{renderer(index)}</React.Fragment>,
      rootTag,
      () => {
        committed = true;
      },
      false,
      null
    );
    return committed;
  };
  globals.__ExpoUIUnmountSyncRow = (rootTag) => fabric.unmountComponentAtNode(rootTag);

  return {
    rendererId,
    update: (render) => {
      registry.set(rendererId, render);
    },
    dispose: () => registry.delete(rendererId),
  };
}
