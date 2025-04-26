/**
 * Copyright (c) 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect } from 'react';
import { ScrollView } from 'react-native';

import { Ansi } from '../AnsiHighlight';
import type { CodeFrame } from '../Data/parseLogBoxLog';
import {
  formatProjectFilePath,
  installPackageInProject,
  openFileInEditor,
} from '../devServerEndpoints';

import styles from './ErrorCodeFrame.module.css';

export function ErrorCodeFrame({
  projectRoot,
  codeFrame,
}: {
  projectRoot?: string;
  codeFrame?: CodeFrame;
}) {
  if (codeFrame == null) {
    return null;
  }

  function getFileName() {
    return formatProjectFilePath(projectRoot ?? '', codeFrame?.fileName);
  }

  function getLocation() {
    const location = codeFrame?.location;
    if (location != null) {
      return ` (${location.row}:${location.column + 1 /* Code frame columns are zero indexed */})`;
    }

    return null;
  }

  return (
    <CodeFrame
      title={
        <>
          {getFileName()}
          <span style={{ opacity: 0.8 }}>{getLocation()}</span>
        </>
      }
      headerIcon={<FileIcon />}
      headerAction={
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
      }
      content={codeFrame.content}
    />
  );
}

export function Terminal({ content, moduleName }: { content?: string; moduleName: string }) {
  return (
    <CodeFrame
      title="Terminal"
      headerAction={
        <button
          className={styles.copyButton}
          type="button"
          title="Run command in project"
          onClick={() => {
            // TODO: Stream back progress
            installPackageInProject(moduleName);
          }}
          aria-label="Copy content">
          <p className={styles.copyButtonText} data-text="true">
            Run
          </p>

          <PlayIcon className={styles.copyButtonIcon} width={26} height={26} />
        </button>
      }
      headerIcon={<TerminalIcon />}
      content={content}
    />
  );
}

export function CodeFrame({
  content,
  headerIcon,
  headerAction,
  title,
}: {
  content?: string;
  headerIcon?: React.ReactNode;
  headerAction?: React.ReactNode;
  title: React.ReactNode;
}) {
  const leftBlurRef = React.useRef<HTMLDivElement>(null);
  const scrollTextRef = React.useRef<HTMLDivElement>(null);

  // Transition the opacity of the header blur when the scroll position changes.
  useEffect(() => {
    const scrollElement = scrollTextRef.current;
    const leftBlurElement = leftBlurRef.current;
    if (scrollElement == null || leftBlurElement == null) {
      return;
    }

    const handleScroll = () => {
      leftBlurElement.style.opacity = String(scrollElement.scrollLeft / 20);
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [scrollTextRef, leftBlurRef]);

  // Scroll to end of the text when it changes
  useEffect(() => {
    const scrollElement = scrollTextRef.current;
    if (scrollElement == null) {
      return;
    }
    scrollElement.scrollTo({
      left: scrollElement.scrollWidth,
      behavior: 'smooth',
    });
  }, [scrollTextRef, content]);

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
          style={{
            display: 'flex',
            width: '100%',
            position: 'relative',
            overflowX: 'hidden',
          }}>
          <span ref={scrollTextRef} className={styles.headerScrollText}>
            <span className={styles.headerIconWrapper} style={{}}>
              {headerIcon}
            </span>

            <span className={styles.headerText}>{title}</span>
          </span>

          <span ref={leftBlurRef} className={styles.blurGradientLR} />
          {/* R-L gradient to fade contents */}
          <span className={styles.blurGradientRL} />
        </span>
        {headerAction}
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
          {content && (
            <Ansi
              style={{
                flexDirection: 'column',
                color: 'var(--expo-log-color-label)',
                fontSize: 12,
                includeFontPadding: false,
                lineHeight: 20,
                fontFamily: 'var(--expo-log-font-mono)',
              }}
              text={content}
            />
          )}
        </ScrollView>
      </div>
    </div>
  );
}

function PlayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
      {...props}
      role="img">
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
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
export function TerminalIcon() {
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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.fileIcon}
      role="img">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" x2="20" y1="19" y2="19" />
    </svg>
  );
}
