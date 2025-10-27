import React from 'react';

import styles from './Header.module.css';
import type { LogLevel } from '../Data/Types';

export function ErrorOverlayHeader({
  selectedIndex,
  total,
  sdkVersion,
  ...props
}: {
  onSelectIndex: (selectedIndex: number) => void;
  level: LogLevel;
  onDismiss: () => void;
  onMinimize: () => void;
  onCopy: () => void;
  onReload?: () => void;
  isDismissable: boolean;
  selectedIndex: number;
  sdkVersion?: string;
  total: number;
}) {
  const titleText = `${selectedIndex + 1}/${total}`;
  const isUNVERSIONED = sdkVersion?.toLowerCase() === 'unversioned' || !sdkVersion;
  return (
    <div className={styles.container}>
      <div className={styles.leftGroup}>
        <div className={styles.headerControls}>
          <HeaderButton
            title="Dismiss error"
            onPress={props.isDismissable ? props.onDismiss : undefined}>
            {/* Dismiss Icon */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="var(--expo-log-secondary-label)"
              xmlns="http://www.w3.org/2000/svg">
              <path d="M6.18945 17.8222C6.10346 17.747 6.04703 17.6556 6.02015 17.5481C5.99328 17.4405 5.99328 17.333 6.02015 17.2255C6.0524 17.118 6.10883 17.0266 6.18945 16.9513L11.1312 11.9998L6.18945 7.04836C6.10883 6.97309 6.05509 6.8817 6.02822 6.77417C6.00134 6.66665 6.00134 6.56181 6.02822 6.45966C6.05509 6.35214 6.10883 6.25806 6.18945 6.17741C6.26469 6.09677 6.35605 6.0457 6.46354 6.02419C6.57103 5.99731 6.67583 5.99731 6.77794 6.02419C6.88006 6.05107 6.97411 6.10215 7.0601 6.17741L12.0018 11.1289L16.9517 6.17741C17.0699 6.05914 17.215 6 17.387 6C17.559 6 17.7041 6.05914 17.8223 6.17741C17.9459 6.29569 18.005 6.44354 17.9997 6.62095C17.9997 6.79299 17.9405 6.93546 17.8223 7.04836L12.8725 11.9998L17.8223 16.9513C17.9405 17.0642 17.9997 17.2067 17.9997 17.3787C17.9997 17.5508 17.9405 17.6986 17.8223 17.8222C17.7041 17.9459 17.559 18.005 17.387 17.9997C17.215 17.9997 17.0699 17.9405 16.9517 17.8222L12.0018 12.8708L7.0601 17.8222C6.97411 17.9029 6.88006 17.954 6.77794 17.9755C6.67583 18.0024 6.57103 18.0024 6.46354 17.9755C6.35605 17.954 6.26469 17.9029 6.18945 17.8222Z" />
            </svg>
          </HeaderButton>

          <HeaderButton
            title="Minimize errors"
            onPress={props.isDismissable ? props.onMinimize : undefined}>
            {/* Minimize Icon */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="var(--expo-log-secondary-label)"
              xmlns="http://www.w3.org/2000/svg">
              <path d="M5 11.5C5 11.2239 5.22386 11 5.5 11H18.5C18.7761 11 19 11.2239 19 11.5V11.5C19 11.7761 18.7761 12 18.5 12H5.5C5.22386 12 5 11.7761 5 11.5V11.5Z" />
            </svg>
          </HeaderButton>
        </div>

        <div className={styles.divider} />

        <div className={styles.navGroup}>
          <HeaderButton
            title="Previous error"
            disabled={total <= 1}
            onPress={() =>
              props.onSelectIndex(selectedIndex - 1 < 0 ? total - 1 : selectedIndex - 1)
            }>
            <ChevronIcon left />
          </HeaderButton>

          <span
            style={{
              fontSize: 16,
              fontFamily: 'var(--expo-log-font-mono)',
              color: 'var(--expo-log-secondary-label)',
            }}>
            {titleText}
          </span>

          <HeaderButton
            title="Next error"
            disabled={total <= 1}
            onPress={() => props.onSelectIndex((selectedIndex + 1) % total)}>
            {/* Right Chevron */}
            <ChevronIcon />
          </HeaderButton>
        </div>
      </div>

      <div className={styles.headerControls}>
        {props.onReload && (
          <HeaderButton title="Reload application" onPress={() => props.onReload?.()}>
            <ReloadIcon />
          </HeaderButton>
        )}
        <HeaderButton title="Copy error" onPress={() => props.onCopy()}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#98989F"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
            <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            <path d="M16 4h2a2 2 0 0 1 2 2v4" />
            <path d="M21 14H11" />
            <path d="m15 10-4 4 4 4" />
          </svg>
        </HeaderButton>

        <div
          className={styles.sdkBadge}
          style={{
            borderColor: isUNVERSIONED ? 'var(--expo-log-secondary-label)' : undefined,
          }}>
          <svg
            className={styles.sdkIcon}
            fill="white"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg">
            <path d="M0 20.084c.043.53.23 1.063.718 1.778.58.849 1.576 1.315 2.303.567.49-.505 5.794-9.776 8.35-13.29a.761.761 0 011.248 0c2.556 3.514 7.86 12.785 8.35 13.29.727.748 1.723.282 2.303-.567.57-.835.728-1.42.728-2.046 0-.426-8.26-15.798-9.092-17.078-.8-1.23-1.044-1.498-2.397-1.542h-1.032c-1.353.044-1.597.311-2.398 1.542C8.267 3.991.33 18.758 0 19.77Z" />
          </svg>
          <span className={styles.sdkText}>{isUNVERSIONED ? `Debug` : `Expo ${sdkVersion}`}</span>
        </div>
      </div>
    </div>
  );
}

function ChevronIcon({ left }: { left?: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="var(--expo-log-secondary-label)"
      xmlns="http://www.w3.org/2000/svg">
      {left ? (
        <path d="M7 11.5C7 11.6053 7.01978 11.7014 7.05934 11.7881C7.0989 11.8748 7.16154 11.9554 7.24725 12.0297L14.6846 18.7955C14.8297 18.9318 15.011 19 15.2286 19C15.3736 19 15.5055 18.969 15.6242 18.9071C15.7363 18.8513 15.8286 18.7677 15.9011 18.6561C15.967 18.5446 16 18.4207 16 18.2844C16 18.0861 15.9275 17.9157 15.7824 17.7732L8.87912 11.5L15.7824 5.23606C15.9275 5.08736 16 4.91698 16 4.72491C16 4.5824 15.967 4.45849 15.9011 4.35316C15.8286 4.24164 15.7363 4.15489 15.6242 4.09294C15.5055 4.03098 15.3736 4 15.2286 4C15.011 4 14.8297 4.07125 14.6846 4.21375L7.24725 10.9796C7.16154 11.0539 7.0989 11.1344 7.05934 11.2212C7.01978 11.3079 7 11.4009 7 11.5Z" />
      ) : (
        <path d="M17 11.5C17 11.6053 16.9802 11.7014 16.9407 11.7881C16.9011 11.8748 16.8385 11.9554 16.7527 12.0297L9.31538 18.7955C9.17033 18.9318 8.98901 19 8.77143 19C8.62637 19 8.49451 18.969 8.37582 18.9071C8.26374 18.8513 8.17143 18.7677 8.0989 18.6561C8.03297 18.5446 8 18.4207 8 18.2844C8 18.0861 8.07253 17.9157 8.21758 17.7732L15.1209 11.5L8.21758 5.23606C8.07253 5.08736 8 4.91698 8 4.72491C8 4.5824 8.03297 4.45849 8.0989 4.35316C8.17143 4.24164 8.26374 4.15489 8.37582 4.09294C8.49451 4.03098 8.62637 4 8.77143 4C8.98901 4 9.17033 4.07125 9.31538 4.21375L16.7527 10.9796C16.8385 11.0539 16.9011 11.1344 16.9407 11.2212C16.9802 11.3079 17 11.4009 17 11.5Z" />
      )}
    </svg>
  );
}

function ReloadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="var(--expo-log-secondary-label)"
      xmlns="http://www.w3.org/2000/svg">
      <path d="M7.248 1.307A.75.75 0 118.252.193l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 01-1.004-1.114l1.29-1.161a4.5 4.5 0 103.655 2.832.75.75 0 111.398-.546A6 6 0 118.018 2l-.77-.693z" />
    </svg>
  );
}

function HeaderButton(props: {
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      title={props.title}
      className={styles.pageButton}
      aria-disabled={!props.onPress || props.disabled ? true : undefined}
      onClick={props.disabled ? undefined : props.onPress}>
      {props.children}
    </button>
  );
}
