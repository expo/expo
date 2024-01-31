import { LinkBase, mergeClasses } from '@expo/styleguide';
import type { ComponentType, PropsWithChildren } from 'react';

import { PermalinkBase } from './PermalinkBase';
import { PermalinkCopyButton } from './PermalinkCopyButton';

import { AdditionalProps } from '~/common/headingManager';
import withHeadingManager, {
  HeadingManagerProps,
} from '~/components/page-higher-order/withHeadingManager';

type Props = PropsWithChildren<{
  // Sidebar heading level override
  nestingLevel?: number;
  additionalProps?: AdditionalProps;
  id?: string;
}>;

const Permalink: ComponentType<Props> = withHeadingManager((props: Props & HeadingManagerProps) => {
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
    <PermalinkBase
      component={component}
      className={mergeClasses(props.additionalProps?.className, 'group')}>
      <LinkBase
        className="scroll-m-5 relative text-[inherit] decoration-0"
        href={'#' + heading.slug}
        ref={heading.ref}
        id={heading.slug}>
        <span className="inline">{children}</span>
        <PermalinkCopyButton
          slug={heading.slug}
          className="invisible group-hover:visible group-focus-visible:visible"
        />
      </LinkBase>
    </PermalinkBase>
  );
});

export { Permalink };
