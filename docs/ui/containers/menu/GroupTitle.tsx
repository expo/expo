import { css } from '@emotion/react';
import { iconSize } from '@expo/styleguide';
import React, { MouseEvent, PropsWithChildren } from 'react';

import { LABEL } from '~/ui/components/Text';
import { ChevronDownIcon } from '~/ui/foundations/icons';

type GroupTitleProps = PropsWithChildren<{
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  isOpen?: boolean;
}>;

export const GroupTitle = ({ children, isOpen = false, ...rest }: GroupTitleProps) => (
  <button css={buttonStyle} type="button" {...rest}>
    <ChevronDownIcon css={[iconStyle, !isOpen && closedIconStyle]} size={iconSize.small} />
    <LABEL css={{ fontWeight: 600 }}>{children}</LABEL>
  </button>
);

const buttonStyle = css`
  outline: none;
  border: 0;
  text-decoration: none;
  background-color: transparent;
  cursor: pointer;
  width: 100%;
  padding: 0.5rem 0;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const iconStyle = css`
  margin-right: 0.5rem;
`;

const closedIconStyle = css`
  transform: rotate(-90deg);
`;
