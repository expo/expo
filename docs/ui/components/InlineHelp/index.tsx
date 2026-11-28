import { mergeClasses } from '@expo/styleguide';
import { AlertCircleIcon } from '@expo/styleguide-icons/outline/AlertCircleIcon';
import { AlertTriangleIcon } from '@expo/styleguide-icons/outline/AlertTriangleIcon';
import { XCircleIcon } from '@expo/styleguide-icons/outline/XCircleIcon';
import { InfoCircleSolidIcon } from '@expo/styleguide-icons/solid/InfoCircleSolidIcon';
import {
  Children,
  cloneElement,
  HTMLAttributes,
  isValidElement,
  ReactElement,
  type ComponentType,
  type PropsWithChildren,
  type ReactNode,
} from 'react';

type CalloutType = 'default' | 'important' | 'warning' | 'error' | 'info' | 'info-light';

type Props = PropsWithChildren<{
  type?: CalloutType;
  className?: string;
  icon?: ComponentType<HTMLAttributes<SVGSVGElement>>;
  size?: 'sm' | 'md';
}>;

const extractType = (childrenArray: ReactNode[]) => {
  const firstChild = Children.toArray(childrenArray[0])[0];

  if (isValidElement<PropsWithChildren>(firstChild)) {
    if (typeof firstChild.props.children === 'string') {
      return firstChild.props.children.toLowerCase();
    }
    if (Array.isArray(firstChild.props.children)) {
      return firstChild.props.children[0].toLowerCase();
    }
  }

  return false;
};

export const InlineHelp = ({ type = 'default', size = 'md', icon, children, className }: Props) => {
  const childrenArray = Children.toArray(children);
  const content = childrenArray.find(child => isValidElement(child));
  const contentChildren = Children.toArray(
    isValidElement<PropsWithChildren>(content) && content?.props?.children
  );

  const extractedType = extractType(contentChildren);
  const finalType = ['warning', 'error', 'info', 'important'].includes(extractedType)
    ? extractedType
    : type;
  const Icon = icon ?? getCalloutIcon(finalType);

  // A type marker sits inside the first child, so drop the marker from that child and keep
  // every later child. Rendering only the first child's remainder loses the rest of the callout.
  const renderedChildren =
    type === finalType
      ? children
      : childrenArray.map(child =>
          child === content && isValidElement<PropsWithChildren>(child)
            ? cloneElement(child, {
                children: contentChildren.filter((_, index) => index !== 0),
              })
            : child
        );

  return (
    <blockquote
      className={mergeClasses(
        'mb-5 flex gap-2 rounded-lg border-0.5 border-default p-[15.5px]',
        size === 'sm' && 'p-3',
        '[table_&]:last:mb-0',
        '[&_code]:bg-element',
        '[&_a]:text-default [&_a]:underline [&_a:visited]:text-default [&_a_*]:text-inherit',
        getCalloutColor(finalType),
        // TODO(simek): remove after migration to new components is completed
        '[&_p]:mb-0!',
        className
      )}
      data-testid="callout-container"
      data-md="callout">
      <Icon
        aria-hidden="true"
        className={mergeClasses(
          'select-none',
          size === 'sm' ? 'mt-0.5 icon-sm' : 'icon-md',
          getCalloutIconColor(finalType)
        )}
      />
      <div
        className={mergeClasses(
          'w-full text-sm leading-[1.4] font-medium text-default',
          '[&_:is(p,li)]:text-sm [&_:is(p,li)]:leading-[1.4] [&_:is(p,li)]:font-medium [&_:is(p,li)]:text-default',
          '[&_:is(p,li)>span]:leading-[1.4]',
          'last:mb-0',
          size === 'sm' && '[&_code]:text-[90%]'
        )}>
        {renderedChildren}
      </div>
    </blockquote>
  );
};

function getCalloutColor(type: CalloutType) {
  switch (type) {
    case 'warning':
      return mergeClasses(
        'border-palette-yellow6 bg-palette-yellow3/40',
        `[&_code]:border-palette-yellow5 [&_code]:bg-palette-yellow4`,
        `selection:bg-palette-yellow5 dark:selection:bg-palette-yellow6`,
        `dark:[&_code]:border-palette-yellow6 dark:[&_code]:bg-palette-yellow5`
      );
    case 'important':
      return mergeClasses(
        'border-palette-purple6 bg-palette-purple3/40',
        `[&_code]:border-palette-purple5 [&_code]:bg-palette-purple4`,
        `selection:bg-palette-purple5 dark:selection:bg-palette-purple6`,
        `dark:[&_code]:border-palette-purple6 dark:[&_code]:bg-palette-purple5`
      );
    case 'error':
      return mergeClasses(
        'border-palette-red6 bg-palette-red3/40',
        `[&_code]:border-palette-red6 [&_code]:bg-palette-red5`,
        `selection:bg-palette-red5 dark:selection:bg-palette-red6`
      );
    default:
      return 'bg-[#FBFCFD] dark:bg-screen';
  }
}

function getCalloutIcon(type: CalloutType): (props: HTMLAttributes<SVGSVGElement>) => ReactElement {
  switch (type) {
    case 'warning':
      return AlertTriangleIcon;
    case 'important':
      return AlertCircleIcon;
    case 'error':
      return XCircleIcon;
    default:
      return InfoCircleSolidIcon;
  }
}

function getCalloutIconColor(type: CalloutType) {
  switch (type) {
    case 'warning':
      return 'text-palette-yellow11';
    case 'important':
      return 'text-palette-purple11';
    case 'error':
      return 'text-palette-red11';
    default:
      return 'text-icon-default';
  }
}
