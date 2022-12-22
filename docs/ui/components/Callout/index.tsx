import { css } from '@emotion/react';
import {
  borderRadius,
  iconSize,
  theme,
  spacing,
  ErrorIcon,
  InfoIcon,
  WarningIcon,
  typography,
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
          <Icon size={iconSize.sm} color={getCalloutIconColor(finalType)} />
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
      return theme.text.danger;
    case 'info':
      return theme.text.info;
    default:
      return theme.icon.default;
  }
}

const containerStyle = css({
  backgroundColor: theme.background.subtle,
  border: `1px solid ${theme.border.default}`,
  borderRadius: borderRadius.md,
  display: 'flex',
  padding: `${spacing[3]}px ${spacing[4]}px`,
  marginBottom: spacing[4],

  'table &': {
    ':last-of-type': {
      marginBottom: 0,
    },
  },

  code: {
    backgroundColor: theme.background.element,
  },

  // TODO(simek): remove after migration to new components is completed
  p: {
    marginBottom: `0 !important`,
  },
});

const iconStyle = css({
  fontStyle: 'normal',
  marginRight: spacing[2],
  marginTop: spacing[1],
  userSelect: 'none',
});

const contentStyle = css({
  ...typography.fontSizes[16],
  color: theme.text.default,

  '*:last-child': {
    marginBottom: 0,
  },
});

const warningColorStyle = css({
  backgroundColor: theme.background.warning,
  borderColor: theme.border.warning,

  code: {
    backgroundColor: theme.palette.yellow5,
    borderColor: theme.palette.yellow7,
  },

  '.dark-theme & code': {
    backgroundColor: theme.palette.yellow6,
    borderColor: theme.palette.yellow7,
  },
});

const errorColorStyle = css({
  backgroundColor: theme.background.danger,
  borderColor: theme.border.danger,

  code: {
    backgroundColor: theme.palette.red2,
    borderColor: theme.palette.red5,
  },

  '.dark-theme & code': {
    backgroundColor: theme.palette.red4,
  },
});

const infoColorStyle = css({
  backgroundColor: theme.background.info,
  borderColor: theme.border.info,

  code: {
    backgroundColor: theme.palette.blue2,
    borderColor: theme.palette.blue5,
  },

  '.dark-theme & code': {
    backgroundColor: theme.palette.blue4,
  },
});
