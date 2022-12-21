import { css } from '@emotion/react';
import { typography } from '@expo/styleguide';
import React, { forwardRef, DOMAttributes } from 'react';

type Props = DOMAttributes<HTMLButtonElement> & {
  testID?: string;
};

export const ButtonBase = forwardRef<HTMLButtonElement, Props>(function ButtonBase(props, ref) {
  const { testID, ...rest } = props;
  return <button css={buttonBaseStyle} data-testid={testID} ref={ref} {...rest} />;
});

const buttonBaseStyle = css({
  ...typography.fontSizes[16],
  display: 'flex',
  textAlign: 'left',
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
});
