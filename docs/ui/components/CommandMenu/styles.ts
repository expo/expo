import { css } from '@emotion/react';
import { theme, shadows, typography } from '@expo/styleguide';
import { borderRadius, spacing, breakpoints } from '@expo/styleguide-base';

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

    @media screen and (max-width: ${breakpoints.medium}px) {
      display: none;
    }
  }

  [cmdk-root] {
    position: fixed;
    top: 45%;
    left: 50%;
    transform: translate(-50%, -50%);
    min-height: 75vh;
    max-height: 75vh;
    background: ${theme.background.default};
    border-radius: ${borderRadius.lg}px;
    box-shadow: ${shadows.sm};
    width: 40vw;
    min-width: 680px;
    border: 1px solid ${theme.border.default};
    z-index: 1001;

    @media screen and (max-width: ${breakpoints.medium}px) {
      min-height: 100vh;
      max-height: 100vh;
      width: 100vw;
      min-width: 100vw;
      top: 50%;
      border-radius: 0;
    }
  }

  [cmdk-input] {
    appearance: none;
    background: transparent;
    color: ${theme.text.default};
    flex: 1;
    font: inherit;
    height: 100%;
    outline: none;
    padding: ${spacing[3]}px ${spacing[11]}px;
    margin: ${spacing[4]}px ${spacing[4]}px 0;
    border: 1px solid ${theme.border.default};
    border-radius: ${borderRadius.md}px;
    width: calc(100% - ${spacing[8]}px);
    box-sizing: border-box;
    box-shadow: ${shadows.xs};

    &::placeholder {
      color: ${theme.icon.secondary};
    }
  }

  [cmdk-item] {
    content-visibility: auto;
    cursor: pointer;
    min-height: 52px;
    border-radius: ${borderRadius.md}px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: ${spacing[1]}px ${spacing[3]}px;
    color: ${theme.text.default};
    user-select: none;
    will-change: background, color;
    transition: all 150ms ease;
    transition-property: none;

    &[aria-selected='true'],
    &:active {
      background: ${theme.background.element};
      color: ${theme.text.default};

      mark {
        background: ${theme.palette.blue5};
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
      color: ${theme.palette.blue12};
      background: ${theme.palette.blue4};
      border-radius: 2px;
    }
  }

  [cmdk-list] {
    height: calc(75vh - 50px - 50px - 20px);
    max-height: calc(75vh - 50px - 50px - 20px);
    overflow: auto;
    overscroll-behavior: contain;
    border-top: 1px solid ${theme.border.default};
    border-bottom: 1px solid ${theme.border.default};
    padding: 0 ${spacing[4]}px;
    margin: ${spacing[3]}px 0 0;

    @media screen and (max-width: ${breakpoints.medium}px) {
      height: calc(100vh - 50px - 50px - 20px);
      max-height: calc(100vh - 50px - 50px - 20px);
    }
  }

  [cmdk-separator] {
    height: 1px;
    width: 100%;
    background: ${theme.border.default};
    margin: ${spacing[1]} 0;
  }

  [cmdk-group-heading] {
    ${typography.fontSizes[12]};
    user-select: none;
    color: ${theme.text.secondary};
    padding: ${spacing[4]}px ${spacing[2]}px ${spacing[2]}px;
    display: flex;
    align-items: center;
    gap: ${spacing[1]}px;
    margin: 0 2px;
  }

  [cmdk-empty] {
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: pre-wrap;
    padding: ${spacing[8]}px 0;
  }

  html.dark-theme {
    [cmdk-item] mark {
      background: ${theme.palette.blue5};

      &[aria-selected='true'] {
        background: ${theme.palette.blue7};
      }
    }
  }
`;

export const searchIconStyle = css({
  position: 'absolute',
  top: 29,
  left: 29,
  transition: 'opacity 0.2s ease-in-out',
});

export const closeIconStyle = css({
  position: 'absolute',
  top: 25,
  right: 25,
  cursor: 'pointer',
  padding: spacing[1],
  borderRadius: borderRadius.sm,

  '&:hover': {
    background: theme.background.element,
  },
});
