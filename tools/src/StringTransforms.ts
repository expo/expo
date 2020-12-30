export type StringTransform = {
  replace: RegExp | string;
  with: string;
};

export type StringTransformMatch = {
  value: string;
  line: number;
  replacedWith: string;
};

export type StringTransformResult = {
  output: string;
  matches: StringTransformMatch[];
};

/**
 * Transforms input string according to the given transform rules.
 * Returns an object with the `output` and `matches`.
 */
export function transform(
  input: string,
  transforms: StringTransform[] | null | undefined
): StringTransformResult {
  if (!transforms) {
    return {
      output: input,
      matches: [],
    };
  }

  const matches: StringTransformMatch[] = [];
  const output = transforms.reduce((acc, transform) => {
    return acc.replace(transform.replace, (match, ...args) => {
      const [offset, string] = args.slice(-2);
      const leftContext = string.substring(0, offset);
      const result = transform.with.replace(/\$[1-9]/g, (m) => args[parseInt(m[1], 10) - 1]);

      matches.push({
        value: match,
        line: leftContext.split(/\n/g).length,
        replacedWith: result,
      });

      return result;
    });
  }, input);

  return {
    output,
    matches,
  };
}
