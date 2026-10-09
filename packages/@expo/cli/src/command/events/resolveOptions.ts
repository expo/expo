import type { TapOptions } from '2g/api';

import { resolveSelector } from '../utils';

export type Options = Pick<TapOptions, 'since' | 'filter' | 'spans' | 'follow'> & {
  selector?: string;
};

export function resolveOptions(
  args: {
    since?: string;
    filter?: string[];
    spans?: boolean;
    tail?: boolean;
  },
  positionals: string[]
): Options {
  const selector = resolveSelector(positionals);
  return {
    selector,
    since: args.since,
    filter: args.filter,
    spans: !!args.spans,
    follow: !!args.tail,
  };
}
