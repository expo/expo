import { css } from '@emotion/react';
import { theme, borderRadius } from '@expo/styleguide';
import React, { CSSProperties, ReactNode } from 'react';

import { P } from '~/ui/components/Text';

type FormErrorProps = {
  error?: string;
  children?: ReactNode;
  style?: CSSProperties;
};

export function FormError(props: FormErrorProps) {
  const { error, style, children } = props;

  return (
    <div css={[containerStyle]} style={style}>
      {error ? (
        <div css={[errorContainerStyle, !children && noChildrenStyle]} data-testid="form-error">
          <P size="small" css={errorTextStyle}>
            {error}
          </P>
        </div>
      ) : null}
      {children}
    </div>
  );
}

const containerStyle = css({
  display: 'flex',
  position: 'relative',
  flex: 1,
  flexDirection: 'column-reverse',
});

const errorContainerStyle = css({
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  padding: 16,
  paddingTop: 18,
  backgroundColor: theme.background.error,
  borderBottomRightRadius: borderRadius.medium,
  borderBottomLeftRadius: borderRadius.medium,
  top: -4,
  whiteSpace: 'pre-wrap',
});

const errorTextStyle = css({
  color: theme.text.error,
});

const noChildrenStyle = css({
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  borderRadius: borderRadius.medium,
  marginBottom: 8,
  top: 0,
});
