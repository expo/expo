import chalk from 'chalk';
import { diffLines } from 'diff';

const CONTEXT_SIZE = 5;

export function printDiff(before: string, after: string): void {
  const diff = diffLines(before, after);
  diff.forEach((part, index) => {
    const isContextEnd = index > 0 && (diff[index - 1].added || diff[index - 1].removed);
    const isContextStart =
      index < diff.length - 1 && (diff[index + 1].added || diff[index + 1].removed);
    let result = '';
    if (part.added) {
      result = chalk.green(part.value);
    } else if (part.removed) {
      result = chalk.red(part.value);
    } else if (isContextEnd && isContextStart) {
      const split = part.value.split('\n');
      if (split.length - 1 > 2 * CONTEXT_SIZE) {
        result = [
          split.slice(0, CONTEXT_SIZE).join('\n'),
          '...',
          split.slice(-CONTEXT_SIZE - 1).join('\n'),
        ].join('\n');
      } else {
        result = part.value;
      }
    } else if (isContextEnd) {
      result = part.value
        .split('\n')
        .slice(0, CONTEXT_SIZE + 1)
        .join('\n');
    } else if (isContextStart) {
      result = part.value
        .split('\n')
        .slice(-CONTEXT_SIZE - 1)
        .join('\n');
    }
    process.stdout.write(result);
  });
  console.log();
}
