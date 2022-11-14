import { css } from '@emotion/react';
import { theme, shadows, borderRadius, spacing } from '@expo/styleguide';

export const commandMenuStyles = css`
  #__next[aria-hidden] {
    filter: blur(3.33px);
  }

  [cmdk-overlay] {
    background-color: rgba(0, 0, 0, 0.33);
    height: 100vh;
    left: 0;
    position: fixed;
    top: 0;
    width: 100vw;
    z-index: 200;
  }

  [cmdk-root] {
    position: fixed;
    top: 45%;
    left: 50%;
    transform: translate(-50%, -50%);
    min-height: 75vh;
    max-height: 75vh;
    background: ${theme.background.default};
    border-radius: ${borderRadius.large}px;
    box-shadow: ${shadows.popover};
    width: 40vw;
    min-width: 680px;
    border: 1px solid ${theme.border.default};
    z-index: 1001;
  }

  [cmdk-input] {
    appearance: none;
    background: transparent;
    color: ${theme.text.default};
    flex: 1;
    font: inherit;
    font-size: 1.2em;
    height: 100%;
    outline: none;
    padding: ${spacing[3]}px ${spacing[3]}px ${spacing[3]}px ${spacing[12]}px;
    margin: ${spacing[4]}px;
    margin-bottom: 0;
    border: 1px solid ${theme.border.default};
    border-radius: ${borderRadius.medium}px;
    width: calc(100% - ${spacing[8]}px);
    box-sizing: border-box;
    box-shadow: ${shadows.input};

    &::placeholder {
      color: ${theme.icon.secondary};
    }
  }

  [cmdk-item] {
    content-visibility: auto;
    cursor: pointer;
    min-height: 52px;
    border-radius: ${borderRadius.medium}px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 4px 12px;
    color: ${theme.text.default};
    user-select: none;
    will-change: background, color;
    transition: all 150ms ease;
    transition-property: none;

    &[aria-selected='true'],
    &:active {
      background: ${theme.background.tertiary};
      color: ${theme.text.default};

      mark {
        background: ${theme.palette.primary[200]};
      }
    }

    &[aria-disabled='true'] {
      color: ${theme.icon.secondary};
      cursor: not-allowed;
    }

    & + [cmdk-item] {
      margin-top: 4px;
    }

    mark {
      color: ${theme.palette.primary[900]};
      background: ${theme.palette.primary[100]};
      border-radius: 2px;
    }
  }

  [cmdk-list] {
    height: calc(75vh - 50px - 50px - 24px);
    max-height: calc(75vh - 50px - 50px - 24px);
    overflow: auto;
    overscroll-behavior: contain;
    border-top: 1px solid ${theme.border.default};
    border-bottom: 1px solid ${theme.border.default};
    padding: 0 ${spacing[3]}px;
    margin: ${spacing[3]}px 0 0;
  }

  [cmdk-separator] {
    height: 1px;
    width: 100%;
    background: var(--gray5);
    margin: 4px 0;
  }

  [cmdk-group-heading] {
    user-select: none;
    font-size: 12px;
    color: ${theme.text.secondary};
    padding: 20px 8px 12px;
    display: flex;
    align-items: center;
    margin: 0 2px;
  }

  [cmdk-empty] {
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 48px;
    white-space: pre-wrap;
    color: var(--gray11);
  }

  html[data-expo-theme='dark'] {
    [cmdk-item] mark {
      background: ${theme.palette.primary[200]};

      &[aria-selected='true'] {
        background: ${theme.palette.primary[300]};
      }
    }
  }
`;

export const searchIconStyle = css({
  position: 'absolute',
  top: 31,
  left: 32,
});

export const loadingIconStyle = css({
  position: 'absolute',
  top: 31,
  right: 32,
  transition: 'opacity 0.2s ease-in-out',
});
