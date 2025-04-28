/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';

import {
  symbolicateStackAndCacheAsync,
  invalidateCachedStack,
  type MetroStackFrame,
} from '../devServerEndpoints';
import type { Category, Message, CodeFrame } from './parseLogBoxLog';

const PRINT_FIXTURES = true;

export type SymbolicationStatus = 'NONE' | 'PENDING' | 'COMPLETE' | 'FAILED';

export type LogLevel = 'error' | 'fatal' | 'syntax' | 'resolution' | 'static';

export type LogBoxLogData = {
  level: LogLevel;
  type?: string;
  message: Message;
  stack: MetroStackFrame[];
  category: string;
  componentStack: MetroStackFrame[];
  codeFrame: Partial<Record<StackType, CodeFrame>>;
  isComponentError: boolean;
  isMissingModuleError?: string;
};

export type StackType = 'stack' | 'component';

type SymbolicationCallback = (status: SymbolicationStatus) => void;

type SymbolicationResult =
  | { error: null; stack: null; status: 'NONE' }
  | { error: null; stack: null; status: 'PENDING' }
  | { error: null; stack: MetroStackFrame[]; status: 'COMPLETE' }
  | { error: Error; stack: null; status: 'FAILED' };

export class LogBoxLog {
  message: Message;
  type: string;
  category: Category;
  componentStack: MetroStackFrame[];
  stack: MetroStackFrame[];
  count: number;
  level: LogLevel;
  codeFrame: Partial<Record<StackType, CodeFrame>> = {};
  isComponentError: boolean;
  isMissingModuleError?: string;

  private symbolicated: Record<StackType, SymbolicationResult> = {
    stack: {
      error: null,
      stack: null,
      status: 'NONE',
    },
    component: {
      error: null,
      stack: null,
      status: 'NONE',
    },
  };

  private callbacks: Map<StackType, Set<SymbolicationCallback>> = new Map();

  constructor(
    data: LogBoxLogData & {
      symbolicated?: Record<StackType, SymbolicationResult>;
    }
  ) {
    this.level = data.level;
    this.type = data.type ?? 'error';
    this.message = data.message;
    this.stack = data.stack;
    this.category = data.category;
    this.componentStack = data.componentStack;
    this.codeFrame = data.codeFrame;
    this.isComponentError = data.isComponentError;
    this.count = 1;
    this.symbolicated = data.symbolicated ?? this.symbolicated;
    this.isMissingModuleError = data.isMissingModuleError;
    // Create unsymbolidated fixture:
    // console.log('LogBoxLog', JSON.stringify(data, null, 2));
  }

  incrementCount(): void {
    this.count += 1;
  }

  getStackStatus(type: StackType) {
    return this.symbolicated[type]?.status;
  }

  getAvailableStack(type: StackType): MetroStackFrame[] | null {
    if (this.symbolicated[type]?.status === 'COMPLETE') {
      return this.symbolicated[type].stack;
    }
    return this.getStack(type);
  }

  private flushCallbacks(type: StackType): void {
    const callbacks = this.callbacks.get(type);
    const status = this.symbolicated[type]?.status;
    if (callbacks) {
      for (const callback of callbacks) {
        callback(status);
      }
      callbacks.clear();
    }
  }

  private pushCallback(type: StackType, callback: SymbolicationCallback): void {
    let callbacks = this.callbacks.get(type);
    if (!callbacks) {
      callbacks = new Set();
      this.callbacks.set(type, callbacks);
    }
    callbacks.add(callback);
  }

  retrySymbolicate(type: StackType, callback?: (status: SymbolicationStatus) => void): void {
    this._symbolicate(type, true, callback);
  }

  symbolicate(type: StackType, callback?: (status: SymbolicationStatus) => void): void {
    this._symbolicate(type, false, callback);
  }

  private _symbolicate(
    type: StackType,
    retry: boolean,
    callback?: (status: SymbolicationStatus) => void
  ): void {
    if (callback) {
      this.pushCallback(type, callback);
    }
    const status = this.symbolicated[type]?.status;

    if (status === 'COMPLETE') {
      if (PRINT_FIXTURES) {
        // Create symbolicated fixture:
        console.log(
          'LogBoxLog.symbolicated:',
          JSON.stringify(
            {
              stack: this.stack,
              componentStack: this.componentStack,
              level: this.level,
              type: this.type,
              message: this.message,
              category: this.category,
              codeFrame: this.codeFrame,
              isComponentError: this.isComponentError,
              symbolicated: this.symbolicated,
            },
            null,
            2
          )
        );
      }

      return this.flushCallbacks(type);
    }

    if (retry) {
      invalidateCachedStack(this.getStack(type));
      this.handleSymbolicate(type);
    } else {
      if (status === 'NONE') {
        this.handleSymbolicate(type);
      }
    }
  }

  private getStack(type: StackType): MetroStackFrame[] {
    if (type === 'component') {
      return this.componentStack;
    }
    return this.stack;
  }

  private handleSymbolicate(type: StackType): void {
    if (this.symbolicated[type]?.status === 'PENDING') {
      return;
    }

    this.updateStatus(type, null, null, null);
    symbolicateStackAndCacheAsync(this.getStack(type)).then(
      (data) => {
        console.log('LogBoxLog.symbolicate:', JSON.stringify(data, null, 2));
        this.updateStatus(type, null, data?.stack, data?.codeFrame);
      },
      (error) => {
        this.updateStatus(type, error, null, null);
      }
    );
  }

  private updateStatus(
    type: StackType,
    error?: Error | null,
    stack?: MetroStackFrame[] | null,
    codeFrame?: CodeFrame | null
  ): void {
    const lastStatus = this.symbolicated[type]?.status;
    if (error != null) {
      this.symbolicated[type] = {
        error,
        stack: null,
        status: 'FAILED',
      };
    } else if (stack != null) {
      if (codeFrame) {
        this.codeFrame[type] = codeFrame;
      }

      this.symbolicated[type] = {
        error: null,
        stack,
        status: 'COMPLETE',
      };
    } else {
      this.symbolicated[type] = {
        error: null,
        stack: null,
        status: 'PENDING',
      };
    }

    const status = this.symbolicated[type]?.status;
    if (lastStatus !== status) {
      if (['COMPLETE', 'FAILED'].includes(status)) {
        this.flushCallbacks(type);
      }
    }
  }
}

export const LogContext = React.createContext<{
  selectedLogIndex: number;
  isDisabled: boolean;
  logs: LogBoxLog[];
} | null>(null);

export function useLogs(): {
  selectedLogIndex: number;
  isDisabled: boolean;
  logs: LogBoxLog[];
} {
  const logs = React.useContext(LogContext);

  if (!logs) {
    // TODO: Move this outside of the hook.
    if (process.env.EXPO_OS === 'web' && typeof window !== 'undefined') {
      // Logbox data that is pre-fetched on the dev server and rendered here.
      const expoCliStaticErrorElement = document.getElementById('_expo-static-error');
      if (expoCliStaticErrorElement?.textContent) {
        const raw = JSON.parse(expoCliStaticErrorElement.textContent);
        return {
          ...raw,
          logs: raw.logs.map((raw: any) => new LogBoxLog(raw)),
        };
      }
    }

    throw new Error('useLogs must be used within a LogContext.Provider');
  }
  return logs;
}
