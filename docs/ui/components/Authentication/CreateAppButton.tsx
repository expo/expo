import { css } from '@emotion/react';
import { ArrowUpRightIcon, breakpoints, theme } from '@expo/styleguide';

import { Button } from '~/ui/components/Button';

type CreateAppButtonProps = { href: string; name: string };

export const CreateAppButton = ({ href, name }: CreateAppButtonProps) => (
  <Button
    css={buttonStyle}
    href={href}
    openInNewTab
    iconRight={<ArrowUpRightIcon color={theme.button.primary.icon} />}>
    Create {name} App
  </Button>
);

const buttonStyle = css({
  display: 'flex',
  minWidth: 'fit-content',

  [`@media screen and (max-width: ${(breakpoints.medium + breakpoints.large) / 2}px)`]: {
    minWidth: '100%',
  },
});
