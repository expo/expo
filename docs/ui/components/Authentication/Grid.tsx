import { css } from '@emotion/react';

export const Grid = ({ children }: React.PropsWithChildren<object>) => (
  <div css={gridStyle}>{children}</div>
);

const gridStyle = css({
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gridTemplateRows: '1fr',
  display: 'grid',
  gap: '1.35rem',
});
