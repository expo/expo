/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useCallback, useMemo } from 'react';

import { ErrorToast } from './ErrorToast';
import * as LogBoxData from '../Data/LogBoxData';
import { LogBoxLog } from '../Data/LogBoxLog';
import { useLogs } from '../Data/LogContext';
import { useRejectionHandler } from '../useRejectionHandler';

import '../ErrorOverlay.css';

export function ErrorToastContainer() {
  useRejectionHandler();
  const { logs, isDisabled } = useLogs();
  if (!logs.length || isDisabled) {
    return null;
  }
  return <ErrorToastStack logs={logs} />;
}

function ErrorToastStack({ logs }: { logs: LogBoxLog[] }) {
  const onDismissWarns = useCallback(() => {
    LogBoxData.clearWarnings();
  }, []);

  const onDismissErrors = useCallback(() => {
    LogBoxData.clearErrors();
  }, []);

  const setSelectedLog = useCallback((index: number): void => {
    LogBoxData.setSelectedLog(index);
  }, []);

  // HACK: This is here to develop the UI for the error overlay.
  // DO NOT SHIP TO PROD!
  React.useEffect(() => {
    // Open the UI for the last log
    LogBoxData.setSelectedLog(0);
  }, []);

  function openLog(log: LogBoxLog) {
    let index = logs.length - 1;
    while (index > 0 && logs[index] !== log) {
      index -= 1;
    }
    setSelectedLog(index);
  }

  const warnings = useMemo(() => logs.filter((log) => log.level === 'warn'), [logs]);

  const errors = useMemo(
    () => logs.filter((log) => log.level === 'error' || log.level === 'fatal'),
    [logs]
  );

  return (
    <div
      style={{
        bottom: 6,
        left: 10,
        right: 10,
        maxWidth: 320,
        position: 'fixed',
      }}>
      {warnings.length > 0 && (
        <ErrorToast
          log={warnings[warnings.length - 1]}
          level="warn"
          totalLogCount={warnings.length}
          onPressOpen={() => openLog(warnings[warnings.length - 1])}
          onPressDismiss={onDismissWarns}
        />
      )}
      {errors.length > 0 && (
        <ErrorToast
          log={errors[errors.length - 1]}
          level="error"
          totalLogCount={errors.length}
          onPressOpen={() => openLog(errors[errors.length - 1])}
          onPressDismiss={onDismissErrors}
        />
      )}
    </div>
  );
}

export default LogBoxData.withSubscription(ErrorToastContainer);
