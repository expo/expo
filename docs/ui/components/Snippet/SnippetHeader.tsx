import { css } from '@emotion/react';
import { LinkBase, mergeClasses, theme } from '@expo/styleguide';
import { borderRadius, spacing } from '@expo/styleguide-base';
import React, { ReactNode, ComponentType, HTMLAttributes, PropsWithChildren } from 'react';

import { HeadingType } from '~/common/headingManager';
import withHeadingManager, {
  HeadingManagerProps,
} from '~/components/page-higher-order/withHeadingManager';
import { LABEL } from '~/ui/components/Text';

type SnippetHeaderProps = PropsWithChildren<{
  title: string | ReactNode;
  Icon?: ComponentType<HTMLAttributes<SVGSVGElement>>;
  alwaysDark?: boolean;
  float?: boolean;
  operationType?: 'delete' | 'add' | 'modify' | undefined;
  showOperation?: boolean;
}>;

export const SnippetHeader = ({
  title,
  children,
  Icon,
  float,
  alwaysDark = false,
  operationType,
  showOperation = false,
}: SnippetHeaderProps) => (
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
);

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

type FileStatusProps = {
  type: string;
};

const FileStatus = ({ type }: FileStatusProps) => {
  const labels = {
    add: 'ADDED',
    modify: 'MODIFIED',
    delete: 'DELETED',
    rename: 'RENAMED',
  };

  return (
    <div className={type === 'delete' ? 'diff-code-delete' : 'diff-code-insert'} css={tagStyle}>
      <span css={labelStyle}>{labels[type as keyof typeof labels]}</span>
    </div>
  );
};

const tagStyle = css({
  display: 'inline-flex',
  fontSize: '90%',
  padding: `${spacing[1]}px ${spacing[2]}px`,
  borderRadius: borderRadius.sm,
  border: `1px solid ${theme.border.default}`,
  alignItems: 'center',
  gap: spacing[1],

  'table &': {
    marginTop: 0,
    marginBottom: spacing[2],
    padding: `${spacing[0.5]}px ${spacing[1.5]}px`,
  },

  'nav &': {
    whiteSpace: 'pre',
  },

  'h3 &': {
    fontSize: '80%',
  },
});

const labelStyle = css({
  lineHeight: `${spacing[4]}px`,
  fontWeight: 'normal',
});
