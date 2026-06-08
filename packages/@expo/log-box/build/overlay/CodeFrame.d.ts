/**
 * Copyright (c) 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import type { CodeFrame as CodeFrameData } from '../Data/Types';
export declare function ErrorCodeFrame({ showPathsRelativeTo, codeFrame, }: {
    showPathsRelativeTo?: string;
    codeFrame?: CodeFrameData;
}): React.JSX.Element | null;
export declare function Terminal({ content, moduleName }: {
    content?: string;
    moduleName: string;
}): React.JSX.Element;
export declare function FileIcon(): React.JSX.Element;
export declare function TerminalIcon(): React.JSX.Element;
