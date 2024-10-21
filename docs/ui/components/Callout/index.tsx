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
        'bg-subtle border border-default flex gap-2 rounded-md shadow-xs py-3 px-4 mb-4',
        '[table_&]:last-of-type:mb-0',
        '[&_code]:bg-element',
        getCalloutColor(finalType),
        // TODO(simek): remove after migration to new components is completed
        '[&_p]:!mb-0',
        size === 'sm' && '!text-xs',
        className
      )}
      data-testid="callout-container">
      <div
        className={mergeClasses('select-none mt-1', '[table_&]:mt-0.5', size === 'sm' && 'mt-0.5')}>
        {typeof icon === 'string' ? (
          icon
        ) : (
          <Icon className={mergeClasses('icon-sm', getCalloutIconColor(finalType))} />
        )}
      </div>
      <div className={mergeClasses('text-default w-full leading-normal', 'last:mb-0')}>
        {type === finalType ? children : contentChildren.filter((_, i) => i !== 0)}
      </div>
    </blockquote>
  );
};

function getCalloutColor(type: CalloutType) {
  switch (type) {
    case 'warning':
      return mergeClasses(
        'bg-warning border-warning',
        `[&_code]:bg-palette-yellow4 [&_code]:border-palette-yellow6`,
        `dark:[&_code]:bg-palette-yellow5 dark:[&_code]:border-palette-yellow7`
      );
    case 'error':
      return mergeClasses(
        'bg-danger border-danger',
        `[&_code]:bg-palette-red5 [&_code]:border-palette-red7`
      );
    case 'info':
      return mergeClasses(
        'bg-info border-info',
        `[&_code]:bg-palette-blue4 [&_code]:border-palette-blue6`
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
