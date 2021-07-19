import { css } from '@emotion/react';
import { borderRadius, iconSize, theme } from '@expo/styleguide';
import React, { PropsWithChildren, ReactNode } from 'react';

import { P } from '~/ui/components/Text';
import { InfoIcon } from '~/ui/foundations/icons';

export type NoteProps = PropsWithChildren<{
  icon?: ReactNode;
}>;

export const InfoNote = ({ icon, children, ...rest }: NoteProps) => {
  return (
    <div css={containerStyle} {...rest}>
      <div css={iconStyle}>
        <P style={{ color: theme.icon.default }}>{icon || <InfoIcon size={iconSize.small} />}</P>
      </div>
      <div css={contentStyle}>{children}</div>
    </div>
  );
};

const containerStyle = css`
  background-color: ${theme.background.secondary};
  border: 1px solid ${theme.border.default};
  border-radius: ${borderRadius.medium}px;
  display: flex;
  padding: 1rem;
`;

const iconStyle = css`
  margin-right: 0.5rem;
`;

const contentStyle = css`
  p:last-child {
    margin-bottom: 0 !important; // TODO(cedric): Find an alternative for this
  }
`;
