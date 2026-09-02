import { LinkBase } from '@expo/styleguide';
import React from 'react';

import { HeadingType } from '~/common/headingManager';
import withHeadingManager, { HeadingManagerProps } from '~/common/withHeadingManager';

import { SnippetHeader, SnippetHeaderProps } from './SnippetHeader';

export const PermalinkedSnippetHeader = withHeadingManager(
  (props: SnippetHeaderProps & HeadingManagerProps) => {
    const { headingManager, title, ...snippetHeaderProps } = props;
    let sidebarTitle;
    if (typeof title === 'string') {
      const pathSegments = title.split('/');
      // when paths are too long, generate headers like:
      // android/../AndroidManifest.xml
      sidebarTitle =
        pathSegments.length > 2 ? pathSegments[0] + '/../' + pathSegments.at(-1) : title;
    }
    const heading = headingManager.addHeading(title, 3, {
      sidebarTitle,
      sidebarType: HeadingType.CODE_FILE_PATH,
    });

    return (
      <div id={heading.slug} ref={heading.ref} className="scroll-m-4">
        <SnippetHeader
          {...snippetHeaderProps}
          title={
            <LinkBase href={'#' + heading.slug} className="text-inherit hocus:underline">
              {title}
            </LinkBase>
          }
        />
      </div>
    );
  }
);
