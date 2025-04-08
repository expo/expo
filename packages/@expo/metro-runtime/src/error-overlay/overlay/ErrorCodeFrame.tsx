/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { CodeFrame } from '../Data/parseLogBoxLog';
import { Ansi } from '../UI/AnsiHighlight';
import * as LogBoxStyle from '../UI/LogBoxStyle';
import { CODE_FONT } from '../UI/constants';
import { openFileInEditor } from '../devServerEndpoints';
import { formatProjectFilePath } from '../formatProjectFilePath';

declare const process: any;

export function ErrorCodeFrame({ codeFrame }: { codeFrame?: CodeFrame }) {
  if (codeFrame == null) {
    return null;
  }

  function getFileName() {
    return formatProjectFilePath(process.env.EXPO_PROJECT_ROOT, codeFrame?.fileName);
  }

  function getLocation() {
    const location = codeFrame?.location;
    if (location != null) {
      return ` (${location.row}:${location.column + 1 /* Code frame columns are zero indexed */})`;
    }

    return null;
  }

  // Try to match the Expo docs
  return (
    <View style={styles.box}>
      <header
        style={{
          display: 'flex',
          minHeight: 40,
          justifyContent: 'space-between',
          overflow: 'hidden',
          backgroundColor: 'var(--expo-log-color-background)',
          borderBottom: '1px solid var(--expo-log-color-border)',
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          paddingLeft: 12,
          // className="flex min-h-[40px] justify-between overflow-hidden border border-default bg-default rounded-t-md border-b-0 pl-3"
        }}>
        <span
          data-text="true"
          style={{
            color: 'inherit',
            fontSize: 15,
            lineHeight: 1.25,
            letterSpacing: '-0.009rem',
            display: 'flex',
            minHeight: 40,
            width: '100%',
            alignItems: 'center',
            gap: 8,

            paddingRight: 16,
            fontWeight: '600',
            // className="text-default text-[15px] leading-[1.6] tracking-[-0.009rem] flex min-h-10 w-full items-center gap-2 py-1 pr-4 font-medium !leading-tight"
          }}>
          <FileIcon />
          <span
            style={{
              overflowWrap: 'break-word',
              fontFamily: 'var(--expo-log-font-mono)',

              color: 'var(--expo-log-color-label)',
            }}>
            {getFileName()}
            <span style={{ opacity: 0.8 }}>{getLocation()}</span>
          </span>
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            borderLeft: '1px solid var(--expo-log-color-border)',
          }} /* flex items-center justify-end */
        >
          <button
            className="expo-log-code-frame-button"
            type="button"
            onClick={() => {
              openFileInEditor(codeFrame.fileName, codeFrame.location?.row ?? 0);
            }}
            aria-label="Copy content">
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{
                transform: 'translateZ(0)',
                width: '1rem',
                height: '1rem',
                color: 'var(--expo-log-secondary-label)',
              }} /* translate-z icon-sm text-icon-default */
              role="img">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 17L17 7M17 7H7M17 7V17"
              />
            </svg>
            <span
              style={{
                display: 'flex',
                alignSelf: 'center',
                color: 'inherit',
                lineHeight: 1,
              }} /* flex self-center text-inherit leading-none */
            >
              <p
                style={{
                  fontFamily: 'var(--expo-log-font-family)',
                  color: 'var(--expo-log-color-label)',

                  fontWeight: 'normal',
                  fontSize: '14px',

                  letterSpacing: '-0.003rem',
                }} /* text-default font-normal text-[13px] leading-[1.6154] tracking-[-0.003rem] */
                data-text="true">
                Open
              </p>
            </span>
          </button>
        </div>
      </header>

      <div
        style={{
          padding: 10,

          display: 'flex',
          flexDirection: 'column',
        }}>
        <ScrollView
          horizontal
          contentContainerStyle={{
            flexDirection: 'column',
          }}>
          <Ansi style={styles.content} text={codeFrame.content} />
        </ScrollView>
      </div>
    </View>
  );
}

export function FileIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      style={{
        width: '1rem',
        height: '1rem',
        color: 'var(--expo-log-secondary-label)',
      }}
      role="img">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M14 2.26953V6.40007C14 6.96012 14 7.24015 14.109 7.45406C14.2049 7.64222 14.3578 7.7952 14.546 7.89108C14.7599 8.00007 15.0399 8.00007 15.6 8.00007H19.7305M14 17.5L16.5 15L14 12.5M10 12.5L7.5 15L10 17.5M20 9.98822V17.2C20 18.8802 20 19.7202 19.673 20.362C19.3854 20.9265 18.9265 21.3854 18.362 21.673C17.7202 22 16.8802 22 15.2 22H8.8C7.11984 22 6.27976 22 5.63803 21.673C5.07354 21.3854 4.6146 20.9265 4.32698 20.362C4 19.7202 4 18.8802 4 17.2V6.8C4 5.11984 4 4.27976 4.32698 3.63803C4.6146 3.07354 5.07354 2.6146 5.63803 2.32698C6.27976 2 7.11984 2 8.8 2H12.0118C12.7455 2 13.1124 2 13.4577 2.08289C13.7638 2.15638 14.0564 2.27759 14.3249 2.44208C14.6276 2.6276 14.887 2.88703 15.4059 3.40589L18.5941 6.59411C19.113 7.11297 19.3724 7.3724 19.5579 7.67515C19.7224 7.94356 19.8436 8.2362 19.9171 8.5423C20 8.88757 20 9.25445 20 9.98822Z"
      />
    </svg>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: 'var(--expo-log-secondary-system-grouped-background)',
    borderWidth: 1,
    borderColor: 'var(--expo-log-color-border)',

    marginTop: 5,
    borderRadius: 6,
  },
  content: {
    flexDirection: 'column',
    color: LogBoxStyle.getTextColor(1),
    fontSize: 12,
    includeFontPadding: false,
    lineHeight: 20,
    fontFamily: CODE_FONT,
  },
});
