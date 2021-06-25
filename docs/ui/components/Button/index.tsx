import { css } from '@emotion/react';
import { theme, colors, borderRadius, iconSize } from '@expo/styleguide';
import React, { ReactNode, MouseEvent } from 'react';
import { Check, AlertCircle } from 'react-feather';

import { hexToAccessibleHSLA, hexToRGBA } from '~/common/colors';
// import { ActivityIndicator } from '~/ui/components/ActivityIndicator';
import { Link } from '~/ui/components/Link';
// import { FormStates } from '~/ui/components/form';
import { fontStacks } from '~/ui/foundations/typography';

export type ButtonProps = {
  onClick?: (event: MouseEvent) => void;
  children?: ReactNode | string;
  disabled?: boolean;
  // status?: FormStates;
  theme?: 'primary' | 'secondary' | 'tertiary' | 'transparent' | 'ghost';
  style?: any;
  icon?: ReactNode;
  block?: boolean;
  href?: string;
  target?: string;
  small?: boolean;
  mini?: boolean;
  large?: boolean;
  micro?: boolean; // TODO(cedric): We need to for the icon margin changes
  type?: 'button' | 'submit' | 'reset';
  download?: string;
  className?: string;
  testID?: string;
  tabIndex?: number;
};

type Theme = {
  backgroundColor: string;
  color: string;
  border?: string;
  opacity?: number;
};

const themes: { [name: string]: Theme } = {
  primary: {
    backgroundColor: theme.button.primary.background,
    color: theme.button.primary.foreground,
  },
  secondary: {
    backgroundColor: theme.button.secondary.background,
    color: theme.button.secondary.foreground,
  },
  tertiary: {
    backgroundColor: theme.button.tertiary.background,
    color: theme.button.tertiary.foreground,
  },
  transparent: {
    backgroundColor: theme.button.transparent.background,
    color: theme.button.transparent.foreground,
  },
  ghost: {
    backgroundColor: theme.button.ghost.background,
    color: theme.button.ghost.foreground,
    border: `1px solid ${theme.button.ghost.border}`,
  },
};

export function Button(props: ButtonProps) {
  const {
    onClick,
    block,
    disabled,
    icon,
    children,
    theme = 'primary',
    style,
    href,
    target,
    small,
    mini,
    large,
    micro,
    // status = FormStates.IDLE,
    type = 'button',
    download,
    className,
    testID,
  } = props;

  // const statusPresent = status !== FormStates.IDLE;
  const buttonBackgroundColor = style?.backgroundColor ?? themes[theme].backgroundColor;
  const buttonTextColor = style?.color ?? themes[theme].color;
  const buttonBorder = style?.border ?? themes[theme].border;
  // const canInteract = !disabled && !statusPresent;
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
    // status === FormStates.SUCCESS && successStyle,
    // status === FormStates.ERRORED && erroredStyle,
    small && smallStyle,
    large && largeStyle,
    mini && miniStyle,
    micro && microStyle,
  ];
  // const childrenStyles = [childrenStyle, statusPresent && statusPresentStyle];
  const childrenStyles = [childrenStyle];
  const ButtonComponent = href ? Link : 'button';
  // const canClick = !statusPresent && !disabled;
  const canClick = !disabled;

  return (
    <ButtonComponent
      data-testid={testID}
      type={type}
      className={className}
      css={styles}
      style={style}
      disabled={disabled}
      onClick={
        canClick
          ? onClick
          : (e: MouseEvent) => {
              e.preventDefault();
            }
      }
      {...(href && {
        href: canClick ? props.href : '#',
        target,
        download,
        testID,
      })}>
      {/* {statusPresent && (
        <div>
          {status === FormStates.LOADING && (
            <ActivityIndicator
              size={mini ? iconSize.small : iconSize.regular}
              color={buttonTextColor}
            />
          )}
          {status === FormStates.SUCCESS && (
            <Check
              size={iconSize.regular}
              stroke={colors.white}
              css={css({
                position: 'relative',
                top: 2,
                marginTop: -2,
                marginBottom: -2,
              })}
            />
          )}
          {status === FormStates.ERRORED && (
            <AlertCircle
              size={iconSize.regular}
              stroke={colors.white}
              css={css({
                position: 'relative',
                top: 2,
              })}
            />
          )}
        </div>
      )} */}
      <div css={childrenStyles}>
        {icon && (
          <div
            css={[
              iconContainerStyle,
              css({
                borderRight: `1px solid ${hexToRGBA(buttonTextColor, 0.15)}`,
              }),
              micro && { marginRight: 6 }, // TODO(cedric): We need this to match the design
              isIconOnly && iconButtonStyle,
            ]}>
            {icon}
          </div>
        )}
        <div>{children}</div>
      </div>
    </ButtonComponent>
  );
}

const buttonStyle = css({
  fontFamily: fontStacks.demi,
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

// const statusPresentStyle = css({
//   visibility: 'hidden',
//   height: 0,
// });

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

const microStyle = css`
  height: 24px;
  font-size: 13px;
  padding: 4px 8px;
  margin: 0 8px;
`;

// const successStyle = css({
//   backgroundColor: colors.semantic.success,
// });

// const erroredStyle = css({
//   backgroundColor: colors.semantic.warning,
// });
