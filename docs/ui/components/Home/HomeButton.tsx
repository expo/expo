import React from 'react';

import { Button, ButtonProps } from '~/ui/components/Button';

export const HomeButton = ({ children, style, ...rest }: ButtonProps) => (
  <Button
    {...rest}
    style={{
      fontSize: 15,
      height: 36,
      paddingLeft: 12,
      paddingRight: 12,
      position: 'absolute',
      bottom: 28,
      zIndex: 10,
      ...style,
    }}>
    {children}
  </Button>
);
