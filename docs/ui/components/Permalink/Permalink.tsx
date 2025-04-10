import { Button, mergeClasses } from '@expo/styleguide';
import { Children, type PropsWithChildren } from 'react';

import { AdditionalProps } from '~/common/headingManager';
import withHeadingManager, { HeadingManagerProps } from '~/common/withHeadingManager';
import { PermalinkIcon } from '~/ui/components/Permalink/PermalinkIcon';

import { PermalinkBase } from './PermalinkBase';

type Props = PropsWithChildren<{
  // Sidebar heading level override
  nestingLevel?: number;
  additionalProps?: AdditionalProps;
  id?: string;
}>;

const Permalink = withHeadingManager((props: Props & HeadingManagerProps) => {
  // NOTE(jim): Not the greatest way to generate permalinks.
  // for now I've shortened the length of permalinks.
  const component = props.children as JSX.Element;
  const children = component.props.children ?? '';
  const hasMultipleChildren = Children.toArray(children).length > 1;

  if (!props.nestingLevel) {
    return children;
  }

  const heading = props.headingManager.addHeading(
    children,
    props.nestingLevel,
    props.additionalProps,
    props.id
  );

  const isDeepNested = props.nestingLevel >= 3;

  return (
    <PermalinkBase component={component} className="group flex gap-1">
      {hasMultipleChildren ? <span>{children}</span> : children}
      <Button
        theme="quaternary"
        className={mergeClasses(
          'relative my-auto inline-flex size-[25px] min-w-[25px] justify-center p-0 transition-all duration-default',
          'invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100',
          isDeepNested && 'size-[22px] min-w-[22px]',
          props.additionalProps?.sidebarType === 'text' ? 'scroll-m-5' : 'scroll-m-8',
          props.additionalProps?.className
        )}
        href={'#' + heading.slug}
        ref={heading.ref}
        id={heading.slug}>
        <PermalinkIcon className={mergeClasses('icon-sm shrink-0', isDeepNested && 'icon-xs')} />
      </Button>
    </PermalinkBase>
  );
});

export { Permalink };
