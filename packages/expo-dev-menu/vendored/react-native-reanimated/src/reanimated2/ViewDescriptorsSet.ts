// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useRef } from 'react';
import { makeMutable } from './core';
import { SharedValue } from './hook/commonTypes';

export interface ViewRefSet<T> {
  items: Set<T>;
  add: (item: T) => void;
  remove: (item: T) => void;
}

export interface ViewDescriptorsSet {
  batchToRemove: Set<number>;
  tags: Set<number>;
  waitForInsertSync: boolean;
  waitForRemoveSync: boolean;
  sharableViewDescriptors: SharedValue<Descriptor[]>;
  items: Descriptor[];
  add: (item: Descriptor) => void;
  remove: (viewTag: number) => void;
  rebuildsharableViewDescriptors: (
    sharableViewDescriptor: SharedValue<Descriptor[]>
  ) => void;
}

export function makeViewDescriptorsSet(): ViewDescriptorsSet {
  const ref = useRef(null);
  if (ref.current === null) {
    const data = {
      batchToRemove: new Set(),
      tags: new Set(),
      waitForInsertSync: false,
      waitForRemoveSync: false,
      sharableViewDescriptors: makeMutable([]),
      items: [],

      add: (item: Descriptor) => {
        if (data.tags.has(item.tag)) {
          return;
        }
        data.tags.add(item.tag);
        data.items.push(item);

        if (!data.waitForInsertSync) {
          data.waitForInsertSync = true;

          setImmediate(() => {
            data.sharableViewDescriptors.value = data.items;
            data.waitForInsertSync = false;
          });
        }
      },

      remove: (viewTag: number) => {
        data.batchToRemove.add(viewTag);

        if (!data.waitForRemoveSync) {
          data.waitForRemoveSync = true;

          setImmediate(() => {
            const items = [];
            for (const item of data.items) {
              if (data.batchToRemove.has(item.tag)) {
                data.tags.delete(item.tag);
              } else {
                items.push(item);
              }
            }
            data.items = items;
            data.sharableViewDescriptors.value = items;
            data.batchToRemove = new Set();
            data.waitForRemoveSync = false;
          });
        }
      },

      rebuildsharableViewDescriptors: (
        sharableViewDescriptors: SharedValue<Descriptor[]>
      ) => {
        data.sharableViewDescriptors = sharableViewDescriptors;
      },
    };
    ref.current = data;
  }

  return ref.current;
}

export function makeViewsRefSet(): ViewRefSet {
  const ref = useRef(null);
  if (ref.current === null) {
    const data = {
      items: new Set(),

      add: (item) => {
        if (data.items.has(item)) return;
        data.items.add(item);
      },

      remove: (item) => {
        data.items.delete(item);
      },
    };
    ref.current = data;
  }

  return ref.current;
}
