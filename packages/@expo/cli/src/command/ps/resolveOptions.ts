import { resolveSelector } from '../utils';

export type Options = {
  selector?: string;
  active: boolean;
  json: boolean;
};

export function resolveOptions(
  args: { active?: boolean; json?: boolean },
  positionals: string[]
): Options {
  return {
    selector: resolveSelector(positionals),
    active: !!args.active,
    json: !!args.json,
  };
}
