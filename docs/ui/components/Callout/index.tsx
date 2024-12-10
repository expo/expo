import { mergeClasses } from '@expo/styleguide';
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
  icon?: ComponentType<HTMLAttributes<SVGSVGElement>> | string;
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
      className={mergeClasses(
        'mb-4 flex gap-2 rounded-md border border-default bg-subtle px-4 py-3 shadow-xs',
        '[table_&]:last:mb-0',
        '[&_code]:bg-element',
        getCalloutColor(finalType),
        // TODO(simek): remove after migration to new components is completed
        '[&_p]:!mb-0',
        className
      )}
      data-testid="callout-container">
      <div
        className={mergeClasses('mt-1 select-none', '[table_&]:mt-0.5', size === 'sm' && 'mt-0.5')}>
        {typeof icon === 'string' ? (
          icon
        ) : (
          <Icon className={mergeClasses('icon-sm', getCalloutIconColor(finalType))} />
        )}
      </div>
      <div
        className={mergeClasses(
          'w-full leading-normal text-default',
          'last:mb-0',
          size === 'sm' && 'text-xs [&_code]:text-[90%] [&_p]:text-xs'
        )}>
        {type === finalType ? children : contentChildren.filter((_, i) => i !== 0)}
      </div>
    </blockquote>
  );
};

function getCalloutColor(type: CalloutType) {
  switch (type) {
    case 'warning':
      return mergeClasses(
        'border-warning bg-warning',
        `[&_code]:border-palette-yellow5 [&_code]:bg-palette-yellow4`,
        `selection:bg-palette-yellow5 dark:selection:bg-palette-yellow6`,
        `dark:[&_code]:border-palette-yellow6 dark:[&_code]:bg-palette-yellow5`
      );
    case 'error':
      return mergeClasses(
        'border-danger bg-danger',
        `[&_code]:border-palette-red6 [&_code]:bg-palette-red5`,
        `selection:bg-palette-red5 dark:selection:bg-palette-red6`
      );
    case 'info':
      return mergeClasses(
        'border-info bg-info',
        `[&_code]:border-palette-blue5 [&_code]:bg-palette-blue4`,
        `dark:selection:bg-palette-yellow6`
      );
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
