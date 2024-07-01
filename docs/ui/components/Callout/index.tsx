import { css } from '@emotion/react';
import { mergeClasses, theme, typography } from '@expo/styleguide';
import { AlertTriangleSolidIcon } from '@expo/styleguide-icons/solid/AlertTriangleSolidIcon';
import { InfoCircleSolidIcon } from '@expo/styleguide-icons/solid/InfoCircleSolidIcon';
import { XSquareSolidIcon } from '@expo/styleguide-icons/solid/XSquareSolidIcon';
import {
  Children,
  HTMLAttributes,
  isValidElement,
  type ComponentType,
  type PropsWithChildren,
  type ReactNode,
} from 'react';

type CalloutType = 'default' | 'warning' | 'error' | 'info';

type CalloutProps = PropsWithChildren<{
  type?: CalloutType;
  className?: string;
  icon?: ComponentType<any> | string;
  size?: 'sm' | 'md';
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

export const Callout = ({
  type = 'default',
  size = 'md',
  icon,
  children,
  className,
}: CalloutProps) => {
  const content = Children.toArray(children).filter(child => isValidElement(child))[0];
  const contentChildren = Children.toArray(isValidElement(content) && content?.props?.children);

  const extractedType = extractType(contentChildren);
  const finalType = ['warning', 'error', 'info'].includes(extractedType) ? extractedType : type;
  const Icon = icon || getCalloutIcon(finalType);

  return (
    <blockquote
      css={[containerStyle, getCalloutColor(finalType)]}
      className={mergeClasses(
        'flex gap-2 rounded-md shadow-xs py-3 px-4 mb-4',
        '[table_&]:last-of-type:mb-0',
        // TODO(simek): remove after migration to new components is completed
        '[&_p]:!mb-0',
        className
      )}
      data-testid="callout-container">
      <div
        className={mergeClasses(
          'select-none mt-[5px]',
          '[table_&]:mt-[3px]',
          size === 'sm' && 'mt-[3px]'
        )}>
        {typeof icon === 'string' ? (
          icon
        ) : (
          <Icon className={mergeClasses('icon-sm', getCalloutIconColor(finalType))} />
        )}
      </div>
      <div
        css={size === 'sm' ? contentSmStyle : contentMdStyle}
        className={mergeClasses('text-default w-full', 'last:mb-0')}>
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

  code: {
    backgroundColor: theme.background.element,
  },
});

const contentMdStyle = css({
  ...typography.fontSizes[16],
});

const contentSmStyle = css({
  ...typography.fontSizes[14],
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
