import { css } from '@emotion/react';
import { theme, typography } from '@expo/styleguide';

export const h1 = css({
  ...typography.headers.default.h1,
  color: theme.text.default,
});

export const h2 = css({
  ...typography.headers.default.h2,
  color: theme.text.default,
});

export const h3 = css({
  ...typography.headers.default.h3,
  color: theme.text.default,
});

export const h4 = css({
  ...typography.headers.default.h4,
  color: theme.text.default,
});

export const paragraph = css({
  ...typography.body.paragraph,
  color: theme.text.default,
});
