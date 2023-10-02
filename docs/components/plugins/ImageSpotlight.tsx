import { theme } from '@expo/styleguide';
import { CSSProperties } from 'react';

type Props = {
  alt: string;
  style?: CSSProperties;
  containerStyle?: CSSProperties;
  src: string;
  caption?: string;
};

export default function ImageSpotlight({ alt, src, style, containerStyle, caption }: Props) {
  return (
    <figure
      style={{
        textAlign: 'center',
        backgroundColor: theme.background.subtle,
        paddingTop: 10,
        paddingBottom: 10,
        marginTop: 20,
        marginBottom: 20,
        ...containerStyle,
      }}>
      <img src={src} alt={alt} style={style} className="inline" />
      {caption && (
        <figcaption
          style={{
            marginTop: 14,
            fontSize: 14,
            color: theme.text.secondary,
            textAlign: 'center',
          }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
