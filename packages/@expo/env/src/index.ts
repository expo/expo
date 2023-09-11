/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { createControlledEnvironment, getFiles, isEnabled } from './env';

const { get, load } = createControlledEnvironment();

export { getFiles, get, load, isEnabled };
