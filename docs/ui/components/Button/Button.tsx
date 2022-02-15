import { css } from '@emotion/react';
import { theme as styleguideTheme, borderRadius, typography } from '@expo/styleguide';
import React, { ReactNode, MouseEvent } from 'react';

import { ButtonBase } from './ButtonBase';
import { hexToAccessibleHSLA, hexToRGBA } from './colors';

import { LinkBase } from '~/ui/components/Text';

type ButtonTheme = keyof typeof styleguideTheme.button;
type ButtonSize = 'mini' | 'small' | 'large';

export type ButtonProps = {
  onClick?: (event: MouseEvent) => void;
  children?: ReactNode | string;
  disabled?: boolean;
  theme?: ButtonTheme;
  style?: any;
  icon?: ReactNode;
  iconRight?: ReactNode;
  block?: boolean;
  href?: string;
  target?: string;
  size?: ButtonSize;
  type?: 'button' | 'submit' | 'reset';
  download?: string;
  className?: string;
  testID?: string;
  tabIndex?: number;
  openInNewTab?: boolean;
  title?: string;
};

type Theme = {
  backgroundColor: string;
  color: string;
  border?: string;
  opacity?: number;
};

const buttonThemes: Record<ButtonTheme, Theme> = {
  primary: {
    backgroundColor: styleguideTheme.button.primary.background,
    color: styleguideTheme.button.primary.foreground,
  },
  secondary: {
    backgroundColor: styleguideTheme.button.secondary.background,
    color: styleguideTheme.button.secondary.foreground,
  },
  tertiary: {
    backgroundColor: styleguideTheme.button.tertiary.background,
    color: styleguideTheme.button.tertiary.foreground,
  },
  transparent: {
    backgroundColor: styleguideTheme.button.transparent.background,
    color: styleguideTheme.button.transparent.foreground,
  },
  ghost: {
    backgroundColor: styleguideTheme.button.ghost.background,
    color: styleguideTheme.button.ghost.foreground,
    border: `1px solid ${styleguideTheme.button.ghost.border}`,
  },
};

export function Button(props: ButtonProps) {
  const {
    onClick,
    block,
    disabled,
    icon,
    iconRight,
    children,
    theme = 'primary',
    style,
    href,
    target,
    size,
    type = 'button',
    download,
    className,
    testID,
    openInNewTab,
    title,
  } = props;

  const buttonBackgroundColor = style?.backgroundColor ?? buttonThemes[theme].backgroundColor;
  const buttonTextColor = style?.color ?? buttonThemes[theme].color;
  const buttonBorder = style?.border ?? buttonThemes[theme].border;
  const canInteract = !disabled;
  const isIconOnly = icon && !children;
  const accessibilityFocusStyle = css({
    ':focus': {
      boxShadow: `0 0 0 3px ${hexToAccessibleHSLA(buttonBackgroundColor, 0.5)}`,
    },
  });
  const themeStyle = css({
    backgroundColor: buttonBackgroundColor,
    color: buttonTextColor,
    border: buttonBorder,
  });

  const styles = [
    buttonStyle,
    themeStyle,
    icon && hasIconStyle,
    canInteract && buttonInteractionStyle,
    disabled && disabledStyle,
    block && blockStyle,
    href && linkButtonStyle,
    isIconOnly && iconOnlyButtonStyle,
    canInteract && accessibilityFocusStyle,
    getButtonSize(size),
  ];
  const childrenStyles = [childrenStyle];
  const ButtonComponent = href ? LinkBase : ButtonBase;
  const componentLinkedProps = !href
    ? // Button-specific props
      { type, disabled }
    : // Link-specific props
      {
        href: canInteract ? props.href : '#',
        target,
        download,
        openInNewTab,
      };

  return (
    <ButtonComponent
      {...componentLinkedProps}
      className={className}
      css={styles}
      style={style}
      testID={testID}
      onClick={!canInteract ? onNonInteractClick : onClick}
      title={title}>
      <div css={childrenStyles}>
        {icon && (
          <div
            css={[
              iconContainerStyle,
              css({ borderRight: `1px solid ${hexToRGBA(buttonTextColor, 0.15)}` }),
              isIconOnly && iconButtonStyle,
            ]}>
            {icon}
          </div>
        )}
        <div>{children}</div>
        {iconRight && (
          <div
            css={[
              iconRightContainerStyle,
              css({ borderLeft: `1px solid ${hexToRGBA(buttonTextColor, 0.15)}` }),
              isIconOnly && iconButtonStyle,
            ]}>
            {iconRight}
          </div>
        )}
      </div>
    </ButtonComponent>
  );
}

function onNonInteractClick(event: MouseEvent) {
  event.preventDefault();
}

function getButtonSize(size?: ButtonSize) {
  switch (size) {
    case 'mini':
      return miniStyle;
    case 'small':
      return smallStyle;
    case 'large':
      return largeStyle;
  }
}

const buttonStyle = css({
  fontFamily: typography.fontStacks.medium,
  fontSize: 16,
  lineHeight: 1,
  height: 40,
  borderRadius: borderRadius.medium,
  border: 0,
  outline: 'none',
  padding: '0 16px',
  textDecoration: 'none',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
});

const hasIconStyle = css({ paddingTop: 0, paddingBottom: 0, height: 40 });

const childrenStyle = css({
  display: 'flex',
  alignItems: 'center',
});

const buttonInteractionStyle = css({
  cursor: 'pointer',
  transition: '150ms',
  // transform prevents a 1px shift on hover on Safari
  transform: 'translate3d(0,0,0)',
  ':hover': {
    boxShadow: '0 2px 8px rgba(0, 1, 0, 0.2)',
    opacity: 0.85,
  },
  ':active': {
    outline: 0,
  },
});

const disabledStyle = css({
  opacity: 0.65,
  cursor: 'not-allowed',
});

const iconOnlyButtonStyle = css({
  width: 40,
  ':hover': {
    boxShadow: 'none',
  },
});

const linkButtonStyle = css({
  display: 'inline-flex',
  alignItems: 'center',
});

const iconContainerStyle = css({
  marginLeft: -4,
  marginRight: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexGrow: 0,
  opacity: 0.9,
  // transform prevents a 1px shift on hover on Safari
  transform: 'translate3d(0,0,0)',
});

const iconRightContainerStyle = css({
  marginRight: -4,
  marginLeft: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexGrow: 0,
  opacity: 0.9,
  // transform prevents a 1px shift on hover on Safari
  transform: 'translate3d(0,0,0)',
});

const iconButtonStyle = css({
  margin: 0,
  padding: 0,
  border: 'none',
});

const blockStyle = css({
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
});

const largeStyle = css({
  padding: '0 32px',
  height: '52px',
  fontSize: 18,
});

const smallStyle = css({
  height: 36,
  fontSize: 14,
});

const miniStyle = css({
  height: 28,
  fontSize: 12,
  padding: 8,
});
