import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import React, { ReactNode } from 'react';

import { LABEL, P } from '~/ui/components/Text';

type LabelProps = {
  title?: string | ReactNode;
  description?: string;
  htmlFor?: string;
};

export function Label(props: LabelProps) {
  const { title, description, htmlFor, ...rest } = props;

  return (
    <label {...rest} css={containerStyle} htmlFor={htmlFor}>
      {title ? <LABEL>{title}</LABEL> : null}
      {description ? (
        <P size="small" css={descriptionStyle}>
          {description}
        </P>
      ) : null}
    </label>
  );
}

const containerStyle = {
  marginBottom: 8,
  display: 'block',
};

const descriptionStyle = css({
  marginTop: 4,
  color: theme.text.secondary,
  maxWidth: 500,
});
