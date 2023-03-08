import { css } from '@emotion/react';
import { mergeClasses, theme, typography } from '@expo/styleguide';
import { borderRadius, spacing } from '@expo/styleguide-base';
import {
  XSquareSolidIcon,
  InfoCircleSolidIcon,
  AlertTriangleSolidIcon,
} from '@expo/styleguide-icons';
import { Children, HTMLAttributes, isValidElement } from 'react';
import type { PropsWithChildren, ReactNode, ComponentType } from 'react';

type CalloutType = 'default' | 'warning' | 'error' | 'info';

type CalloutProps = PropsWithChildren<{
  type?: CalloutType;
  icon?: ComponentType<any> | string;
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
          <Icon className={mergeClasses('icon-sm', getCalloutIconColor(finalType))} />
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

function getCalloutIcon(type: CalloutType): (props: HTMLAttributes<SVGSVGElement>) => JSX.Element {
  switch (type) {
    case 'warning':
      return AlertTriangleSolidIcon;
    case 'error':
      return XSquareSolidIcon;
    default:
      return InfoCircleSolidIcon;
  }
}

function getCalloutIconColor(type: CalloutType) {
  switch (type) {
    case 'warning':
      return 'text-warning';
    case 'error':
      return 'text-danger';
    case 'info':
      return 'text-info';
    default:
      return 'text-icon-default';
  }
}

const containerStyle = css({
  backgroundColor: theme.background.subtle,
  border: `1px solid ${theme.border.default}`,
  borderRadius: borderRadius.md,
  display: 'flex',
  gap: spacing[2],
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
  marginTop: 5,
  userSelect: 'none',

  'table &': {
    marginTop: 3,
  },
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
    backgroundColor: theme.palette.yellow4,
    borderColor: theme.palette.yellow6,
  },

  '.dark-theme & code': {
    backgroundColor: theme.palette.yellow5,
    borderColor: theme.palette.yellow7,
  },
});

const errorColorStyle = css({
  backgroundColor: theme.background.danger,
  borderColor: theme.border.danger,

  code: {
    backgroundColor: theme.palette.red5,
    borderColor: theme.palette.red7,
  },
});

const infoColorStyle = css({
  backgroundColor: theme.background.info,
  borderColor: theme.border.info,

  code: {
    backgroundColor: theme.palette.blue4,
    borderColor: theme.palette.blue6,
  },
});
