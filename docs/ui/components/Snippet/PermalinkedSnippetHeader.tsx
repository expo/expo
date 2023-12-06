import { LinkBase, mergeClasses } from '@expo/styleguide';
import React from 'react';

import { FileStatus } from './FileStatus';
import { SnippetHeaderProps } from './SnippetHeader';

import { HeadingType } from '~/common/headingManager';
import withHeadingManager, {
  HeadingManagerProps,
} from '~/components/page-higher-order/withHeadingManager';
import { LABEL } from '~/ui/components/Text';

export const PermalinkedSnippetHeader = withHeadingManager(
  (props: SnippetHeaderProps & HeadingManagerProps) => {
    const {
      title,
      children,
      Icon,
      float,
      alwaysDark = false,
      operationType,
      showOperation = false,
    } = props;
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
      <LinkBase id={heading.slug} href={'#' + heading.slug} ref={heading.ref}>
        <div
          className={mergeClasses(
            'flex pl-4 overflow-hidden justify-between bg-default border border-default min-h-[40px]',
            !float && 'rounded-t-md border-b-0',
            float && 'rounded-md my-4',
            Icon && 'pl-3',
            alwaysDark && 'dark-theme pr-2 dark:border-transparent !bg-palette-gray3'
          )}>
          <LABEL
            className={mergeClasses(
              'flex items-center gap-2 h-10 !leading-10 pr-4 select-none font-medium truncate',
              alwaysDark && 'text-palette-white'
            )}>
            {Icon && <Icon className="icon-sm" />}
            {title}
            {showOperation && operationType ? <FileStatus type={operationType} /> : null}
          </LABEL>
          {!!children && <div className="flex justify-end items-center">{children}</div>}
        </div>
      </LinkBase>
    );
  }
);
