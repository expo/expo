import { Button, ButtonProps, mergeClasses } from '@expo/styleguide';

export const HomeButton = ({ children, style, href, className, ...rest }: ButtonProps) => (
  <Button
    {...rest}
    href={href}
    openInNewTab={href?.startsWith('http')}
    className={mergeClasses('absolute bottom-7 z-10 px-3.5', 'hocus:opacity-80', className)}>
    {children}
  </Button>
);
