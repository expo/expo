/**
 * Copyright © 2025 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext } from 'react';

export type ServerDataLoaderData = Record<string, any> | null;

export const ServerDataLoaderContext = createContext<ServerDataLoaderData>(null);
