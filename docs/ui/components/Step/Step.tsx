import { css } from '@emotion/react';
import { spacing, theme, typography } from '@expo/styleguide';
import { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
  label: string;
  connected?: boolean;
}>;

export const Step = ({ children, label, connected }: Props) => {
  return (
    <div css={stepWrapperStyle}>
      <div>
        <div css={stepLabelStyle}>{label}</div>
        {connected && <div css={stepConnectionStyle} />}
      </div>
      <div css={stepContentStyle}>{children}</div>
    </div>
  );
};

const stepWrapperStyle = css({
  display: 'grid',
  gridTemplateColumns: `${spacing[9]}px minmax(0, 1fr)`,
  gap: spacing[4],
  margin: `${spacing[2]}px 0`,
  float: 'left',
});

const stepLabelStyle = css({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  alignSelf: 'center',
  margin: `0 auto`,
  width: spacing[9],
  height: spacing[9],
  fontFamily: typography.fontStacks.semiBold,
  color: theme.text.secondary,
  background: theme.background.secondary,
  borderRadius: '100%',
  border: `1px solid ${theme.border.default}`,
});

const stepConnectionStyle = css({
  width: '50%',
  height: `calc(100% - ${spacing[5]}px)`,
  borderRight: `1px solid ${theme.border.default}`,
});

const stepContentStyle = css({
  paddingTop: spacing[1],

  'h2:first-child, h3:first-child, h4:first-child': {
    marginTop: -spacing[1],
  },

  'ul, ol': {
    marginBottom: 0,
  },
});
