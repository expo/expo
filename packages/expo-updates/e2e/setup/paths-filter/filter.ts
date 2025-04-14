import * as jsyaml from 'js-yaml';

import { File, ChangeStatus } from './file';

const picomatch = require('picomatch').default;

// Type definition of object we expect to load from YAML
interface FilterYaml {
  [name: string]: FilterItemYaml;
}
type FilterItemYaml =
  | string // Filename pattern, e.g. "path/to/*.js"
  | { [changeTypes: string]: string | string[] } // Change status and filename, e.g. added|modified: "path/to/*.js"
  | FilterItemYaml[]; // Supports referencing another rule via YAML anchor

// Minimatch options used in all matchers
const MatchOptions = {
  dot: true,
};

// Internal representation of one item in named filter rule
// Created as simplified form of data in FilterItemYaml
interface FilterRuleItem {
  status?: ChangeStatus[]; // Required change status of the matched files
  isMatch: (str: string) => boolean; // Matches the filename
}

/**
 * Enumerates the possible logic quantifiers that can be used when determining
 * if a file is a match or not with multiple patterns.
 *
 * The YAML configuration property that is parsed into one of these values is
 * 'predicate-quantifier' on the top level of the configuration object of the
 * action.
 *
 * The default is to use 'some' which used to be the hardcoded behavior prior to
 * the introduction of the new mechanism.
 *
 * @see https://en.wikipedia.org/wiki/Quantifier_(logic)
 */
export enum PredicateQuantifier {
  /**
   * When choosing 'every' in the config it means that files will only get matched
   * if all the patterns are satisfied by the path of the file, not just at least one of them.
   */
  EVERY = 'every',
  /**
   * When choosing 'some' in the config it means that files will get matched as long as there is
   * at least one pattern that matches them. This is the default behavior if you don't
   * specify anything as a predicate quantifier.
   */
  SOME = 'some',
}

/**
 * Used to define customizations for how the file filtering should work at runtime.
 */
export type FilterConfig = { readonly predicateQuantifier: PredicateQuantifier };

/**
 * An array of strings (at runtime) that contains the valid/accepted values for
 * the configuration parameter 'predicate-quantifier'.
 */
export const SUPPORTED_PREDICATE_QUANTIFIERS = Object.values(PredicateQuantifier);

export function isPredicateQuantifier(x: unknown): x is PredicateQuantifier {
  return SUPPORTED_PREDICATE_QUANTIFIERS.includes(x as PredicateQuantifier);
}

export interface FilterResults {
  [key: string]: File[];
}

export class Filter {
  rules: { [key: string]: FilterRuleItem[] } = {};

  // Creates instance of Filter and load rules from YAML if it's provided
  constructor(
    yaml?: string,
    readonly filterConfig?: FilterConfig
  ) {
    if (yaml) {
      this.load(yaml);
    }
  }

  // Load rules from YAML string
  load(yaml: string): void {
    if (!yaml) {
      return;
    }

    const doc = jsyaml.load(yaml) as FilterYaml;
    if (typeof doc !== 'object') {
      this.throwInvalidFormatError('Root element is not an object');
    }

    for (const [key, item] of Object.entries(doc)) {
      this.rules[key] = this.parseFilterItemYaml(item);
    }
  }

  match(files: File[]): FilterResults {
    const result: FilterResults = {};
    for (const [key, patterns] of Object.entries(this.rules)) {
      result[key] = files.filter((file) => this.isMatch(file, patterns));
    }
    return result;
  }

  private isMatch(file: File, patterns: FilterRuleItem[]): boolean {
    const aPredicate = (rule: Readonly<FilterRuleItem>): boolean => {
      return (
        (rule.status === undefined || rule.status.includes(file.status)) &&
        rule.isMatch(file.filename)
      );
    };
    if (this.filterConfig?.predicateQuantifier === 'every') {
      return patterns.every(aPredicate);
    } else {
      return patterns.some(aPredicate);
    }
  }

  private parseFilterItemYaml(item: FilterItemYaml): FilterRuleItem[] {
    if (Array.isArray(item)) {
      return flat(item.map((i) => this.parseFilterItemYaml(i)));
    }

    if (typeof item === 'string') {
      return [{ status: undefined, isMatch: picomatch(item, MatchOptions) }];
    }

    if (typeof item === 'object') {
      return Object.entries(item).map(([key, pattern]) => {
        if (typeof key !== 'string' || (typeof pattern !== 'string' && !Array.isArray(pattern))) {
          this.throwInvalidFormatError(
            `Expected [key:string]= pattern:string | string[], but [${key}:${typeof key}]= ${pattern}:${typeof pattern} found`
          );
        }
        return {
          status: key
            .split('|')
            .map((x) => x.trim())
            .filter((x) => x.length > 0)
            .map((x) => x.toLowerCase()) as ChangeStatus[],
          isMatch: picomatch(pattern, MatchOptions),
        };
      });
    }

    this.throwInvalidFormatError(`Unexpected element type '${typeof item}'`);
  }

  private throwInvalidFormatError(message: string): never {
    throw new Error(`Invalid filter YAML format: ${message}.`);
  }
}

// Creates a new array with all sub-array elements concatenated
// In future could be replaced by Array.prototype.flat (supported on Node.js 11+)
function flat<T>(arr: T[][]): T[] {
  return arr.reduce((acc, val) => acc.concat(val), []);
}
