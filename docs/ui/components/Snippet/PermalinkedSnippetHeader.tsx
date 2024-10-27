import { LinkBase } from '@expo/styleguide';
import React from 'react';

import { SnippetHeader, SnippetHeaderProps } from './SnippetHeader';

import { HeadingType } from '~/common/headingManager';
import withHeadingManager, {
  HeadingManagerProps,
} from '~/components/page-higher-order/withHeadingManager';

export const PermalinkedSnippetHeader = withHeadingManager(
  (props: SnippetHeaderProps & HeadingManagerProps) => {
    const { title } = props;
    let sidebarTitle;
    if (typeof title === 'string') {
      const pathSegments = title.split('/');
      // when paths are too long, generate headers like:
      // android/../AndroidManifest.xml
      sidebarTitle =
        pathSegments.length > 2
          ? pathSegments[0] + '/../' + pathSegments[pathSegments.length - 1]
          : title;
    }
    const heading = props.headingManager.addHeading(title, 3, {
      sidebarTitle,
      sidebarType: HeadingType.CodeFilePath,
    });

    return (
      <LinkBase
        id={heading.slug}
        href={'#' + heading.slug}
        ref={heading.ref}
        className="scroll-m-4">
        <SnippetHeader {...props} />
      </LinkBase>
    );
  }
);
