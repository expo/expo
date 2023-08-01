/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as LogBoxSymbolication from './LogBoxSymbolication';
import type { Stack } from './LogBoxSymbolication';
import type { Category, Message, ComponentStack, CodeFrame } from './parseLogBoxLog';

type SymbolicationStatus = 'NONE' | 'PENDING' | 'COMPLETE' | 'FAILED';

export type LogLevel = 'warn' | 'error' | 'fatal' | 'syntax' | 'static';

export type LogBoxLogData = {
  level: LogLevel;
  type?: string;
  message: Message;
  stack: Stack;
  category: string;
  componentStack: ComponentStack;
  codeFrame?: CodeFrame;
  isComponentError: boolean;
};

export type StackType = 'stack' | 'component';

function componentStackToStack(componentStack: ComponentStack): Stack {
  return componentStack.map((stack) => ({
    file: stack.fileName,
    methodName: stack.content,
    lineNumber: stack.location?.row ?? 0,
    column: stack.location?.column ?? 0,
    arguments: [],
  }));
}

type SymbolicationCallback = (status: SymbolicationStatus) => void;

type SymbolicationResult =
  | { error: null; stack: null; status: 'NONE' }
  | { error: null; stack: null; status: 'PENDING' }
  | { error: null; stack: Stack; status: 'COMPLETE' }
  | { error: Error; stack: null; status: 'FAILED' };

export class LogBoxLog {
  message: Message;
  type: string;
  category: Category;
  componentStack: ComponentStack;
  stack: Stack;
  count: number;
  level: LogLevel;
  codeFrame?: CodeFrame;
  isComponentError: boolean;
  symbolicated: Record<StackType, SymbolicationResult> = {
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
  }

  incrementCount(): void {
    this.count += 1;
  }

  getAvailableStack(type: StackType): Stack | null {
    if (this.symbolicated[type].status === 'COMPLETE') {
      return this.symbolicated[type].stack;
    }
    return this.getStack(type);
  }

  private flushCallbacks(type: StackType): void {
    const callbacks = this.callbacks.get(type);
    const status = this.symbolicated[type].status;
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
    const status = this.symbolicated[type].status;

    if (status === 'COMPLETE') {
      return this.flushCallbacks(type);
    }

    if (retry) {
      LogBoxSymbolication.deleteStack(this.getStack(type));
      this.handleSymbolicate(type);
    } else {
      if (status === 'NONE') {
        this.handleSymbolicate(type);
      }
    }
  }

  private componentStackCache: Stack | null = null;

  private getStack(type: StackType): Stack {
    if (type === 'component') {
      if (this.componentStackCache == null) {
        this.componentStackCache = componentStackToStack(this.componentStack);
      }
      return this.componentStackCache;
    }
    return this.stack;
  }

  private handleSymbolicate(type: StackType): void {
    if (type === 'component' && !this.componentStack?.length) {
      return;
    }

    if (this.symbolicated[type].status !== 'PENDING') {
      this.updateStatus(type, null, null, null);
      LogBoxSymbolication.symbolicate(this.getStack(type)).then(
        (data) => {
          this.updateStatus(type, null, data?.stack, data?.codeFrame);
        },
        (error) => {
          this.updateStatus(type, error, null, null);
        }
      );
    }
  }

  private updateStatus(
    type: StackType,
    error?: Error | null,
    stack?: Stack | null,
    codeFrame?: CodeFrame | null
  ): void {
    const lastStatus = this.symbolicated[type].status;
    if (error != null) {
      this.symbolicated[type] = {
        error,
        stack: null,
        status: 'FAILED',
      };
    } else if (stack != null) {
      if (codeFrame) {
        this.codeFrame = codeFrame;
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

    const status = this.symbolicated[type].status;
    if (lastStatus !== status) {
      if (['COMPLETE', 'FAILED'].includes(status)) {
        this.flushCallbacks(type);
      }
    }
  }
}
