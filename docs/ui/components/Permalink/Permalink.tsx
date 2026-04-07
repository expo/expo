import { Button, mergeClasses } from '@expo/styleguide';
import { Children, isValidElement, useContext, type PropsWithChildren } from 'react';

import { AdditionalProps } from '~/common/headingManager';
import withHeadingManager, { HeadingManagerProps } from '~/common/withHeadingManager';
import { PermalinkIcon } from '~/ui/components/Permalink/PermalinkIcon';
import { InsideTabsContext } from '~/ui/components/Tabs/InsideTabsContext';

import { PermalinkBase } from './PermalinkBase';

type Props = PropsWithChildren<{
  // Sidebar heading level override
  nestingLevel?: number;
  additionalProps?: AdditionalProps;
  id?: string;
}>;

const Permalink = withHeadingManager((props: Props & HeadingManagerProps) => {
  const insideTabs = useContext(InsideTabsContext);

  // NOTE(jim): Not the greatest way to generate permalinks.
  // for now I've shortened the length of permalinks.
  const component = isValidElement<PropsWithChildren<{ className?: string }>>(props.children)
    ? props.children
    : null;

  if (!component) {
    return props.children;
  }

  const children = component.props.children ?? '';
  const hasMultipleChildren = Children.toArray(children).length > 1;

  if (!props.nestingLevel) {
    return children;
  }

  const additionalProps = insideTabs
    ? { ...props.additionalProps, hideInSidebar: true }
    : props.additionalProps;

  const heading = props.headingManager.addHeading(
    children,
    props.nestingLevel,
    additionalProps,
    props.id
  );

  const isDeepNested = props.nestingLevel >= 3;
  const scrollMarginClass =
    props.additionalProps?.sidebarType === 'text' ? 'scroll-m-5' : 'scroll-m-8';

  return (
    <PermalinkBase
      component={component}
      className={mergeClasses('group flex gap-1', scrollMarginClass)}
      id={heading.slug}>
      {hasMultipleChildren ? <span>{children}</span> : children}
      <Button
        theme="quaternary"
        className={mergeClasses(
          'duration-default relative my-auto inline-flex size-[25px] min-w-[25px] justify-center p-0 transition-all',
          'invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100',
          isDeepNested && 'size-[22px] min-w-[22px]',
          props.additionalProps?.className
        )}
        href={'#' + heading.slug}
        ref={heading.ref}>
        <PermalinkIcon className={mergeClasses('icon-sm shrink-0', isDeepNested && 'icon-xs')} />
      </Button>
    </PermalinkBase>
  );
});

export { Permalink };
