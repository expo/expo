import * as jsondiffpatch from 'jsondiffpatch';
import ConsoleFormatter from 'jsondiffpatch/formatters/console';

/**
 * jsondiffpatch's console formatter prints every unchanged value in full when given the
 * original object, which makes the versions diff hundreds of lines long even for a one-key
 * change. This formatter keeps unchanged primitives (they're useful context) but collapses
 * unchanged objects and arrays into a one-line placeholder.
 */
class CollapsingConsoleFormatter extends ConsoleFormatter {
  // Since 0.7, the formatter prefixes every line of added and deleted values with "+" or "-".
  // Turn this off to keep the previous output, where colors alone show the change.
  prepareContext(context: Parameters<ConsoleFormatter['prepareContext']>[0]): void {
    super.prepareContext(context);
    context.pushLinePrefix = () => {};
    context.popLinePrefix = () => {};
  }

  format_unchanged(context: any, _delta: any, left: any): void {
    if (left === undefined) {
      return;
    }
    if (Array.isArray(left)) {
      context.out(left.length === 0 ? '[]' : `[ … ${pluralize(left.length, 'item')} unchanged ]`);
      return;
    }
    if (left !== null && typeof left === 'object') {
      const count = Object.keys(left).length;
      context.out(count === 0 ? '{}' : `{ … ${pluralize(count, 'key')} unchanged }`);
      return;
    }
    this.formatValue(context, left);
  }
}

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

const formatter = new CollapsingConsoleFormatter();

/**
 * Formats a versions config delta for the console, collapsing sections without changes.
 */
export function formatVersionsDelta(delta: jsondiffpatch.Delta, original: any): string {
  return formatter.format(delta, original) ?? '';
}
