import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import { spacing } from '@expo/styleguide-base';
import { PropsWithChildren } from 'react';

import { HEADLINE } from '~/ui/components/Text';

type Props = PropsWithChildren<{
  label: string;
}>;

export const Step = ({ children, label }: Props) => {
  return (
    <div css={stepWrapperStyle}>
      <HEADLINE css={stepLabelStyle}>{label}</HEADLINE>
      <div css={stepContentStyle}>{children}</div>
    </div>
  );
};

const stepWrapperStyle = css({
  display: 'inline-grid',
  gridTemplateColumns: `${spacing[7]}px minmax(0, 1fr)`,
  gap: spacing[4],
  margin: `${spacing[2]}px 0`,
  width: '100%',
});

const stepLabelStyle = css({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: `${spacing[1]}px auto`,
  width: spacing[7],
  height: spacing[7],
  background: theme.background.element,
  borderRadius: '100%',
});

const stepContentStyle = css({
  paddingTop: spacing[1],

  'h2:first-child': {
    marginTop: `${-spacing[1]}px !important`,
  },

  'h3:first-child, h4:first-child': {
    marginTop: `0 !important`,
  },

  'ul, ol': {
    marginBottom: 0,
  },
});
