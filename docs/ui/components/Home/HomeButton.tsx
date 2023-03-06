import { typography, Button, ButtonProps } from '@expo/styleguide';
import { spacing } from '@expo/styleguide-base';

export const HomeButton = ({ children, style, href, ...rest }: ButtonProps) => (
  <Button
    {...rest}
    href={href}
    rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    style={{
      ...typography.fontSizes[14],
      height: 36,
      paddingLeft: spacing[3.5],
      paddingRight: spacing[3.5],
      position: 'absolute',
      bottom: 28,
      zIndex: 1,
      ...style,
    }}>
    {children}
  </Button>
);
