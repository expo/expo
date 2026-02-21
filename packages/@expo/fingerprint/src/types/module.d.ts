import * as __module from 'module';

declare module 'module' {
  namespace Module {
    export const _cache: Record<string, unknown>;
  }
}
