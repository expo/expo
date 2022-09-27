import { css } from '@emotion/react';
import {
  borderRadius,
  iconSize,
  theme,
  typography,
  spacing,
  ErrorIcon,
  InfoIcon,
  WarningIcon,
} from '@expo/styleguide';
import { IconProps } from '@expo/styleguide/dist/types';
import { Children, ComponentType, PropsWithChildren, isValidElement, ReactNode } from 'react';

type CalloutType = 'default' | 'warning' | 'error' | 'info';

type CalloutProps = PropsWithChildren<{
  type?: CalloutType;
  icon?: ComponentType<IconProps> | string;
}>;

const extractType = (childrenArray: ReactNode[]) => {
  const firstChild = Children.toArray(childrenArray[0])[0];

  if (isValidElement(firstChild)) {
    if (typeof firstChild.props.children === 'string') {
      return firstChild.props.children.toLowerCase();
    }
    if (Array.isArray(firstChild.props.children)) {
      return firstChild.props.children[0].toLowerCase();
    }
  }

  return false;
};

export const Callout = ({ type = 'default', icon, children }: CalloutProps) => {
  const content = Children.toArray(children).filter(child => isValidElement(child))[0];
  const contentChildren = Children.toArray(isValidElement(content) && content?.props?.children);

  const extractedType = extractType(contentChildren);
  const finalType = ['warning', 'error', 'info'].includes(extractedType) ? extractedType : type;
  const Icon = icon || getCalloutIcon(finalType);

  return (
    <blockquote css={[containerStyle, getCalloutColor(finalType)]} data-testid="callout-container">
      <div css={iconStyle}>
        {typeof icon === 'string' ? (
          icon
        ) : (
          <Icon size={iconSize.small} color={getCalloutIconColor(finalType)} />
        )}
      </div>
      <div css={contentStyle}>
        {type === finalType ? children : contentChildren.filter((_, i) => i !== 0)}
      </div>
    </blockquote>
  );
};

function getCalloutColor(type: CalloutType) {
  switch (type) {
    case 'warning':
      return warningColorStyle;
    case 'error':
      return errorColorStyle;
    case 'info':
      return infoColorStyle;
    default:
      return null;
  }
}

function getCalloutIcon(type: CalloutType) {
  switch (type) {
    case 'warning':
      return WarningIcon;
    case 'error':
      return ErrorIcon;
    default:
      return InfoIcon;
  }
}

function getCalloutIconColor(type: CalloutType) {
  switch (type) {
    case 'warning':
      return theme.text.warning;
    case 'error':
      return theme.text.error;
    case 'info':
      return theme.text.info;
    default:
      return theme.icon.default;
  }
}

const containerStyle = css({
  backgroundColor: theme.background.secondary,
  border: `1px solid ${theme.border.default}`,
  borderRadius: borderRadius.medium,
  display: 'flex',
  padding: `${spacing[3]}px ${spacing[4]}px`,
  marginBottom: spacing[4],

  'table &': {
    ':last-of-type': {
      marginBottom: 0,
    },
  },

  code: {
    backgroundColor: theme.background.tertiary,
  },
});

const iconStyle = css({
  fontStyle: 'normal',
  marginRight: spacing[2],
  marginTop: spacing[1],
  userSelect: 'none',
});

const contentStyle = css({
  ...typography.body.paragraph,
  color: theme.text.default,

  '*:last-child': {
    marginBottom: 0,
  },
});

const warningColorStyle = css({
  backgroundColor: theme.background.warning,
  borderColor: theme.border.warning,

  code: {
    backgroundColor: theme.palette.yellow['000'],
    borderColor: theme.palette.yellow[300],
  },

  '[data-expo-theme="dark"] & code': {
    backgroundColor: theme.palette.yellow[100],
    borderColor: theme.palette.yellow[200],
  },
});

const errorColorStyle = css({
  backgroundColor: theme.background.error,
  borderColor: theme.border.error,

  code: {
    backgroundColor: theme.palette.red['000'],
    borderColor: theme.palette.red[200],
  },

  '[data-expo-theme="dark"] & code': {
    backgroundColor: theme.palette.red[100],
  },
});

const infoColorStyle = css({
  backgroundColor: theme.background.info,
  borderColor: theme.border.info,

  code: {
    backgroundColor: theme.palette.blue['000'],
    borderColor: theme.palette.blue[200],
  },

  '[data-expo-theme="dark"] & code': {
    backgroundColor: theme.palette.blue[100],
  },
});
