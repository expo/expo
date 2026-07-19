export type Options = {
  dev: boolean;
  clear: boolean;
};

export async function resolveOptionsAsync(args: any): Promise<Options> {
  return {
    clear: !!args['--clear'],
    dev: !!args['--dev'],
  };
}
