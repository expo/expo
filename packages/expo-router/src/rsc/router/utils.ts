/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * https://github.com/dai-shi/waku/blob/32d52242c1450b5f5965860e671ff73c42da8bd0/packages/waku/src/client.ts#L1
 */

export const filePathToFileURL = (filePath: string) => 'file://' + encodeURI(filePath);

export const encodeInput = (input: string) => {
  if (input === '') {
    return 'index.txt';
  }
  if (input === 'index') {
    throw new Error('Input should not be `index`');
  }
  if (input.startsWith('/')) {
    throw new Error('Input should not start with `/`');
  }
  if (input.endsWith('/')) {
    throw new Error('Input should not end with `/`');
  }
  return input + '.txt';
};

const ACTION_PREFIX = 'ACTION_';

export const encodeActionId = (actionId: string) => {
  const [file, name] = actionId.split('#') as [string, string];
  if (name.includes('/')) {
    throw new Error('Unsupported action name');
  }
  return ACTION_PREFIX + file + '/' + name;
};

export const decodeActionId = (encoded: string) => {
  if (!encoded.startsWith(ACTION_PREFIX)) {
    return null;
  }
  const index = encoded.lastIndexOf('/');
  return encoded.slice(ACTION_PREFIX.length, index) + '#' + encoded.slice(index + 1);
};
