/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import chalk from 'chalk';
import { stripVTControlCharacters } from 'node:util';
import path from 'path';
import terminalLink from 'terminal-link';

import { env } from '../../../utils/env';
import type { CodeFrame, StackFrame } from './log-box/LogBoxSymbolication';

function fill(width: number): string {
  return Array(width).join(' ');
}

function formatPaths(config: { filePath: string | null; line?: number; col?: number }) {
  const filePath = chalk.reset(config.filePath);
  return (
    chalk.dim('(') +
    filePath +
    chalk.dim(`:${[config.line, config.col].filter(Boolean).join(':')})`)
  );
}

function formatProjectFilePath(projectRoot: string, file?: string | null): string {
  if (file == null) {
    return '<unknown>';
  }
  if (file === '<anonymous>') {
    return file;
  }

  return path
    .relative(projectRoot.replace(/\\/g, '/'), file.replace(/\\/g, '/'))
    .replace(/\?.*$/, '');
}

function getStackFormattedLocation(projectRoot: string, frame: StackFrame): string {
  const column = frame.column != null && parseInt(String(frame.column), 10);
  return (
    formatProjectFilePath(projectRoot, frame.file) +
    (frame.lineNumber != null
      ? ':' + frame.lineNumber + (column && !isNaN(column) ? ':' + (column + 1) : '')
      : '')
  );
}

function isInternalBytecode(frame: StackFrame): boolean {
  return frame.file?.includes('InternalBytecode.js') ?? false;
}

export function isExternalCallsite(file: string | null | undefined): boolean {
  return file != null && /(?:^|[/\\])node_modules[/\\]/.test(file);
}

/**
 * Tests given string on presence of ` [num] |` at the start of any line.
 * Returns `false` for undefined or empty strings.
 */
export function likelyContainsCodeFrame(message: string | undefined): boolean {
  if (!message) return false;

  const clean = stripVTControlCharacters(message);
  if (!clean) return false;

  return /^\s*\d+\s+\|/m.test(clean);
}

export function formatStack(
  projectRoot: string,
  {
    stack,
    codeFrame,
    error,
    showCollapsedFrames = env.EXPO_DEBUG,
  }: {
    stack: StackFrame[];
    codeFrame?: CodeFrame;
    error?: Error;
    showCollapsedFrames?: boolean;
  }
): {
  isFallback: boolean;
  stack: string;
} {
  const logs: string[] = [];
  const containsCodeFrame = likelyContainsCodeFrame(error?.message);

  if (containsCodeFrame) {
    // Some transformation errors will have a code frame embedded in the error message
    // from Babel and we should not duplicate it as message is already printed before this call.
  } else if (codeFrame) {
    const maxWarningLineLength = Math.max(800, process.stdout.columns);

    const lineText = codeFrame.content;
    const lines = codeFrame.content.split('\n');

    // ---- index.tsx ------------------------------------------------------
    //  32 |         This is example code which will be under the title.
    const title = path.basename(codeFrame.fileName);
    logs.push(chalk.bold`Code: ${title}`);

    const isPreviewTooLong = lines.some((line) => line.length > maxWarningLineLength);
    const column = codeFrame.location?.column;
    // When the preview is too long, we skip reading the file and attempting to apply
    // code coloring, this is because it can get very slow.
    if (isPreviewTooLong) {
      let previewLine = '';
      let cursorLine = '';

      const formattedPath = formatPaths({
        filePath: codeFrame.fileName,
        line: codeFrame.location?.row,
        col: codeFrame.location?.column,
      });
      // Create a curtailed preview line like:
      // `...transition:'fade'},k._updatePropsStack=function(){clearImmediate(k._updateImmediate),k._updateImmediate...`
      // If there is no text preview or column number, we can't do anything.
      if (lineText && column != null) {
        const rangeWindow = Math.round(
          Math.max(codeFrame.fileName?.length ?? 0, Math.max(80, process.stdout.columns)) / 2
        );
        let minBounds = Math.max(0, column - rangeWindow);
        const maxBounds = Math.min(minBounds + rangeWindow * 2, lineText.length);
        previewLine = lineText.slice(minBounds, maxBounds);

        // If we splice content off the start, then we should append `...`.
        // This is unlikely to happen since we limit the activation size.
        if (minBounds > 0) {
          // Adjust the min bounds so the cursor is aligned after we add the "..."
          minBounds -= 3;
          previewLine = chalk.dim('...') + previewLine;
        }
        if (maxBounds < lineText.length) {
          previewLine += chalk.dim('...');
        }

        // If the column property could be found, then use that to fix the cursor location which is often broken in regex.
        cursorLine = (column == null ? '' : fill(column) + chalk.reset('^')).slice(minBounds);

        logs.push(formattedPath, '', previewLine, cursorLine, chalk.dim('(error truncated)'));
      }
    } else {
      logs.push(codeFrame.content);
    }
  }

  let isFallback = false;
  if (stack?.length) {
    const stackProps = stack.map((frame) => {
      return {
        title: frame.methodName,
        subtitle: getStackFormattedLocation(projectRoot, frame),
        collapse: frame.collapse || isInternalBytecode(frame),
        external: isExternalCallsite(frame.file),
      };
    });

    const stackLines: string[] = [];
    const backupStackLines: string[] = [];

    stackProps.forEach((frame) => {
      const shouldShow = !frame.collapse || showCollapsedFrames;

      const position = terminalLink.isSupported
        ? terminalLink(frame.subtitle, frame.subtitle)
        : frame.subtitle;
      let lineItem = chalk.gray(`  ${frame.title} (${position})`);

      if (frame.collapse || frame.external) {
        lineItem = chalk.dim(lineItem);
      }
      // Never show the internal module system.
      const isMetroRuntime =
        /\/metro-runtime\/src\/polyfills\/require\.js/.test(frame.subtitle) ||
        /\/metro-require\/require\.js/.test(frame.subtitle);
      if (!isMetroRuntime) {
        if (shouldShow) {
          stackLines.push(lineItem);
        }
        backupStackLines.push(lineItem);
      }
    });

    logs.push(chalk.bold`Call Stack`);

    if (!backupStackLines.length) {
      logs.push(chalk.gray('  No stack trace available.'));
    } else {
      isFallback = stackLines.length === 0;
      // If there are no visible stack lines, fall back to the collapsed frames to give the user
      // whatever help we can.
      const displayStack = stackLines.length ? stackLines : backupStackLines;
      logs.push(displayStack.join('\n'));
    }
  } else if (error && error.stack) {
    logs.push(chalk.gray(`  ${error.stack}`));
  }

  return {
    isFallback,
    stack: logs.join('\n'),
  };
}
