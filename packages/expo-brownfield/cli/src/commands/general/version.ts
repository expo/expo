// @ts-expect-error - the directory structure is different after building
import { version } from '../../../../package.json';

/**
 * Prints the version of the CLI (= the version of the package).
 */
const action = async () => {
  console.log(version);
};

export default action;
