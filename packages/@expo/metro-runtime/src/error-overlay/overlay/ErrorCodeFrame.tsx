/**
 * Copyright (c) 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { ScrollView } from 'react-native';

import type { CodeFrame } from '../Data/parseLogBoxLog';
import { Ansi } from '../AnsiHighlight';
import { openFileInEditor, formatProjectFilePath } from '../devServerEndpoints';

declare const process: any;

import styles from './ErrorCodeFrame.module.css';

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
    <div
      style={{
        backgroundColor: 'var(--expo-log-secondary-system-grouped-background)',
        border: '1px solid var(--expo-log-color-border)',
        marginTop: 5,
        borderRadius: 6,
      }}>
      <header className={styles.header}>
        <span
          data-text="true"
          style={{
            color: 'inherit',
            fontSize: 15,
            lineHeight: 1.25,
            letterSpacing: '-0.009rem',
            display: 'flex',

            width: '100%',
            overflowX: 'auto',
            alignItems: 'center',
            gap: 8,
            position: 'relative',
            fontWeight: '600',
            // className="text-default text-[15px] leading-[1.6] tracking-[-0.009rem] flex min-h-10 w-full items-center gap-2 py-1 pr-4 font-medium !leading-tight"
          }}>
          <FileIcon />
          <span
            style={{
              overflowWrap: 'break-word',
              fontFamily: 'var(--expo-log-font-mono)',
              whiteSpace: 'nowrap',
              overflow: 'auto',
              color: 'var(--expo-log-color-label)',
              paddingRight: 16,
            }}>
            {getFileName()}
            <span style={{ opacity: 0.8 }}>{getLocation()}</span>
          </span>

          {/* R-L gradient to fade contents */}
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: 20,
              background:
                'linear-gradient(to left, var(--expo-log-color-background) 0%, rgba(0, 0, 0, 0) 100%)',
            }} /* absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-r from-default to-transparent */
          />
        </span>

        <button
          className={styles.copyButton}
          type="button"
          title="Open in editor"
          onClick={() => {
            openFileInEditor(codeFrame.fileName, codeFrame.location?.row ?? 0);
          }}
          aria-label="Copy content">
          <p className={styles.copyButtonText} data-text="true">
            Open
          </p>

          <OpenIcon className={styles.copyButtonIcon} width={26} height={26} />
        </button>
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
          <Ansi
            style={{
              flexDirection: 'column',
              color: 'var(--expo-log-color-label)',
              fontSize: 12,
              includeFontPadding: false,
              lineHeight: 20,
              fontFamily: 'var(--expo-log-font-mono)',
            }}
            text={codeFrame.content}
          />
        </ScrollView>
      </div>
    </div>
  );
}

function OpenIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props} role="img">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M7 17L17 7M17 7H7M17 7V17"
      />
    </svg>
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
      className={styles.fileIcon}
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
