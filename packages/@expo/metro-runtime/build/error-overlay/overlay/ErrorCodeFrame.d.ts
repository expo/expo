/**
 * Copyright (c) 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import type { CodeFrame } from '../Data/parseLogBoxLog';
export declare function ErrorCodeFrame({ projectRoot, codeFrame, }: {
    projectRoot?: string;
    codeFrame?: CodeFrame;
}): React.JSX.Element | null;
export declare function Terminal({ content, moduleName }: {
    content?: string;
    moduleName: string;
}): React.JSX.Element;
export declare function CodeFrame({ content, headerIcon, headerAction, title, }: {
    content?: string;
    headerIcon?: React.ReactNode;
    headerAction?: React.ReactNode;
    title: React.ReactNode;
}): React.JSX.Element;
export declare function FileIcon(): React.JSX.Element;
export declare function TerminalIcon(): React.JSX.Element;
//# sourceMappingURL=ErrorCodeFrame.d.ts.map