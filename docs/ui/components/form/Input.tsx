import { css } from '@emotion/react';
import React, { InputHTMLAttributes, forwardRef, Ref, CSSProperties } from 'react';

import { FormError } from './FormError';
import { styles } from './Forms.shared';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  id?: string;
  containerStyle?: CSSProperties;
};

export const Input = forwardRef(function (props: InputProps, ref: Ref<HTMLInputElement>) {
  const { error, id, className, containerStyle, ...rest } = props;

  return (
    <FormError error={error} style={containerStyle}>
      <input
        type="text"
        {...rest}
        ref={ref}
        id={id}
        name={id}
        data-testid={id}
        css={[css(styles.input), error ? css(styles.error) : null]}
        className={className}
      />
    </FormError>
  );
});
