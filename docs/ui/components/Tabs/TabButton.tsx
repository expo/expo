import { css } from '@emotion/react';
import { theme, typography } from '@expo/styleguide';
import { spacing } from '@expo/styleguide-base';
import { Tab as ReachTab, TabProps } from '@reach/tabs';

type Props = TabProps & {
  selected?: boolean;
};

export const TabButton = ({ selected, ...props }: Props) => (
  <ReachTab
    {...props}
    css={tabButtonStyles}
    style={{
      borderBottomColor: selected ? theme.palette.blue9 : 'transparent',
      color: selected ? theme.text.default : theme.text.secondary,
    }}
  />
);

const tabButtonStyles = css({
  ...typography.fontSizes[15],
  fontWeight: 500,
  transition: 'all 0.05s ease 0s',
  padding: `${spacing[2.5]}px ${spacing[6]}px ${spacing[2] - 1}px`,
  border: 0,
  borderBottom: '0.2rem solid transparent',
  borderRight: `1px solid ${theme.border.default}`,
  backgroundColor: 'transparent',
  cursor: 'pointer',

  '&:hover': {
    backgroundColor: theme.background.subtle,
  },
});
