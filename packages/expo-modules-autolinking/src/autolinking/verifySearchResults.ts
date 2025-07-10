import chalk from 'chalk';
import path from 'path';

import { PackageRevision, SearchOptions, SearchResults } from '../types';

/**
 * Verifies the search results by checking whether there are no duplicates.
 */
export function verifySearchResults(searchResults: SearchResults, options: SearchOptions): number {
  const relativePath: (pkg: PackageRevision) => string = (pkg) =>
    path.relative(options.projectRoot, pkg.path);
  let counter = 0;

  for (const moduleName in searchResults) {
    const revision = searchResults[moduleName];

    if (revision.duplicates?.length) {
      console.warn(`⚠️  Found multiple versions of ${chalk.green(moduleName)}`);
      console.log(` - ${chalk.magenta(relativePath(revision))} (${chalk.cyan(revision.version)})`);

      for (const duplicate of revision.duplicates) {
        console.log(` - ${chalk.gray(relativePath(duplicate))} (${chalk.gray(duplicate.version)})`);
      }
      counter++;
    }
  }
  if (counter > 0) {
    console.warn(
      '⚠️  Multiple versions of the same module may introduce some side effects or compatibility issues. Remove the duplicate versions.'
    );
  }
  return counter;
}
