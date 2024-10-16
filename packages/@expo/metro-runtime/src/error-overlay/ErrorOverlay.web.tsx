/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as LogBoxData from './Data/LogBoxData';
import { useLogs } from './Data/LogContext';

export function LogBoxInspectorContainer() {
  const { selectedLogIndex, logs } = useLogs();
  const log = logs[selectedLogIndex];
  if (log == null) {
    return null;
  }

  console.log('LOGBOX', log);
  return null;
}

export default LogBoxData.withSubscription(LogBoxInspectorContainer);
