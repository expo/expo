import { Button, ButtonProps, mergeClasses } from '@expo/styleguide';

export function HomeButton({ children, style, href, className, ...rest }: ButtonProps) {
  const isExternal = href?.startsWith('http');

  return (
    <Button
      {...rest}
      data-md="link"
      skipNextLink={!isExternal}
      href={href}
      openInNewTab={isExternal}
      className={mergeClasses('absolute bottom-7 z-10 px-3.5', 'hocus:opacity-80', className)}>
      {children}
    </Button>
  );
}
