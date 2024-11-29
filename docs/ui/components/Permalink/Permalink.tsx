import { LinkBase, mergeClasses } from '@expo/styleguide';
import type { PropsWithChildren } from 'react';

import { PermalinkBase } from './PermalinkBase';

import { AdditionalProps } from '~/common/headingManager';
import withHeadingManager, { HeadingManagerProps } from '~/common/withHeadingManager';
import { PermalinkIcon } from '~/ui/components/Permalink/PermalinkIcon';

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
  const children = component.props.children || '';

  if (!props.nestingLevel) {
    return children;
  }

  const heading = props.headingManager.addHeading(
    children,
    props.nestingLevel,
    props.additionalProps,
    props.id
  );

  return (
    <PermalinkBase component={component} className="group">
      <LinkBase
        className={mergeClasses(
          'relative inline-flex items-center gap-1.5 text-[inherit] decoration-0',
          props.additionalProps?.sidebarType === 'text' ? 'scroll-m-6' : 'scroll-m-12',
          props.additionalProps?.className
        )}
        href={'#' + heading.slug}
        ref={heading.ref}
        id={heading.slug}>
        <span className="inline">{children}</span>
        <PermalinkIcon
          className={mergeClasses(
            'icon-md invisible inline-flex group-hover:visible group-focus-visible:visible',
            props.nestingLevel >= 4 && 'icon-sm'
          )}
        />
      </LinkBase>
    </PermalinkBase>
  );
});

export { Permalink };
