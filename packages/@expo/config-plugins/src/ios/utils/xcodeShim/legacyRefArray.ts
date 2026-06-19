import type { XcodeProject } from '@bacons/xcode';

export interface LegacyRef {
  value: string;
  comment: string;
}

const INDEX = /^\d+$/;
// Array mutators that aren't translated; throw rather than silently dropping
// writes that wouldn't reach the backing model.
const UNSUPPORTED = new Set(['pop', 'shift', 'unshift', 'sort', 'reverse', 'fill', 'copyWithin']);

function projectEntry(model: any): LegacyRef {
  return { value: model.uuid, comment: model.getDisplayName?.() ?? model.uuid };
}

function resolve(project: XcodeProject, entry: any): any {
  const uuid = entry?.value ?? entry;
  try {
    return project.getObject(uuid);
  } catch {
    // Legacy tolerates linking a reference before its object is registered (the
    // object is usually added moments later). Push a stand-in carrying the uuid
    // so serialization emits the right reference once it exists.
    return { uuid, getDisplayName: () => entry?.comment ?? uuid };
  }
}

/**
 * Live `{ value, comment }[]` view over a `@bacons` ref-array (`children` /
 * `files` / `targets`, which hold model instances). Reads project each backing
 * model lazily, so the view is never stale; `push` / `splice` / index writes
 * resolve back to model instances and mutate the backing in place.
 */
export function legacyRefArray(backing: any[], project: XcodeProject): LegacyRef[] {
  const handler: ProxyHandler<any[]> = {
    get(target, prop) {
      if (typeof prop === 'string' && INDEX.test(prop)) {
        const model = target[Number(prop)];
        return model === undefined ? undefined : projectEntry(model);
      }
      if (prop === 'length') return target.length;
      if (prop === 'push') {
        return (...entries: any[]) => {
          for (const entry of entries) target.push(resolve(project, entry));
          return target.length;
        };
      }
      if (prop === 'splice') {
        return (start: number, deleteCount?: number, ...items: any[]) => {
          const models = items.map((item) => resolve(project, item));
          const removed =
            deleteCount === undefined
              ? target.splice(start)
              : target.splice(start, deleteCount, ...models);
          return removed.map(projectEntry);
        };
      }
      if (typeof prop === 'string' && UNSUPPORTED.has(prop)) {
        throw new Error(`legacyRefArray: ${prop}() is not supported`);
      }
      if (prop === Symbol.iterator) {
        return function* () {
          for (const model of target) yield projectEntry(model);
        };
      }
      // Read-only helpers (find/map/some/…) run on a projected snapshot.
      const snapshot = target.map(projectEntry);
      const value = (snapshot as any)[prop];
      return typeof value === 'function' ? value.bind(snapshot) : value;
    },
    set(target, prop, value) {
      if (typeof prop === 'string' && INDEX.test(prop)) {
        target[Number(prop)] = resolve(project, value);
        return true;
      }
      if (prop === 'length') {
        target.length = value;
        return true;
      }
      return Reflect.set(target, prop, value);
    },
  };

  return new Proxy(backing, handler) as unknown as LegacyRef[];
}
