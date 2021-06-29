import { theme } from '@expo/styleguide';
import React from 'react';

type Props = {
  alt: string;
  style?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
  src: string;
};

export default function ImageSpotlight({ alt, src, style, containerStyle }: Props) {
  return (
    <div
      style={{
        textAlign: 'center',
        backgroundColor: theme.background.secondary,
        paddingTop: 10,
        paddingBottom: 10,
        marginTop: 20,
        marginBottom: 20,
        ...containerStyle,
      }}>
      <img src={src} alt={alt} style={style} />
    </div>
  );
}
