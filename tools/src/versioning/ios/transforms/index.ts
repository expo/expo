import chalk from 'chalk';
import path from 'path';

import { VERSIONED_RN_IOS_DIR } from '../../../Constants';

export type TransformConfig = {
  pipeline: TransformPipeline;
  targetPath: string;
  input: string;
};

export type TransformPattern = {
  paths?: string | string[];
  replace: RegExp | string;
  with: string;
};

export type TransformPipeline = {
  logHeader?: (filePath: string) => void;
  transforms: TransformPattern[];
};

export async function runTransformPipelineAsync({ pipeline, targetPath, input }: TransformConfig) {
  let output = input;
  const matches: { value: string; line: number; replacedWith: string }[] = [];

  if (!Array.isArray(pipeline.transforms)) {
    throw new Error("Pipeline's transformations must be an array of transformation patterns.");
  }

  pipeline.transforms
    .filter((transform) => pathMatchesTransformPaths(targetPath, transform.paths))
    .forEach((transform) => {
      output = output.replace(transform.replace, (match, ...args) => {
        const { leftContext } = RegExp as unknown as { leftContext: string };
        const result = transform.with.replace(/\$[1-9]/g, (m) => args[parseInt(m[1], 10) - 1]);

        matches.push({
          value: match,
          line: leftContext.split(/\n/g).length,
          replacedWith: result,
        });

        return result;
      });
    });

  if (matches.length > 0) {
    if (pipeline.logHeader) {
      pipeline.logHeader(path.relative(VERSIONED_RN_IOS_DIR, targetPath));
    }

    for (const match of matches) {
      console.log(
        `${chalk.gray(String(match.line))}:`,
        chalk.red('-'),
        chalk.red(match.value.trimRight())
      );
      console.log(
        `${chalk.gray(String(match.line))}:`,
        chalk.green('+'),
        chalk.green(match.replacedWith.trimRight())
      );
    }
    console.log();
  }

  return output;
}

function pathMatchesTransformPaths(filePath: string, transformPaths?: string | string[]): boolean {
  if (typeof transformPaths === 'string') {
    return filePath.includes(transformPaths);
  }
  if (Array.isArray(transformPaths)) {
    return transformPaths.some((transformPath) => filePath.includes(transformPath));
  }
  return true;
}
