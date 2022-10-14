import { css } from '@emotion/react';
import { borderRadius, shadows, spacing, theme, typography } from '@expo/styleguide';
import { useState } from 'react';

import { Button } from '../Button';
import { A, DEMI, P } from '../Text';

export const NewsletterSignUp = () => {
  const [email, setEmail] = useState('');
  const [userSignedUp, setUserSignedUp] = useState(false);

  return (
    <div css={wrapperStyle}>
      <CALLOUT theme="secondary" weight="medium">
        Sign up for developer updates
      </CALLOUT>
      <div css={inputWrapperStyle}>
        <input
          onChange={event => setEmail(event.target.value)}
          value={email}
          css={inputStyle}
          type="email"
          placeholder={userSignedUp ? 'Thank you for the sign up!' : 'you@email.com'}
          disabled={userSignedUp}
        />
        <Button
          size="mini"
          theme={userSignedUp ? 'ghost' : 'secondary'}
          css={sendButtonStyle}
          disabled={userSignedUp || !email.length}
          onClick={() => {
            setEmail('');
            setUserSignedUp(true);
          }}>
          {userSignedUp ? 'Done!' : 'Sign Up'}
        </Button>
      </div>
      <P theme="secondary" css={noteStyle}>
        Unsubscribe at any time. Read our{' '}
        <A href="https://expo.dev/privacy" target="_blank">
          privacy policy
        </A>
        .
      </P>
    </div>
  );
};

const wrapperStyle = css({
  flex: 1,
  maxWidth: 400,
});

const textStyle = css({
  ...typography.fontSizes[14],
});

const noteStyle = css({
  ...typography.fontSizes[13],
});

const inputWrapperStyle = css({
  position: 'relative',
});

const inputStyle = css({
  fontFamily: typography.fontFaces.regular,
  display: 'block',
  boxSizing: 'border-box',
  boxShadow: shadows.input,
  border: `1px solid ${theme.border.default}`,
  borderRadius: borderRadius.small,
  color: theme.text.default,
  background: theme.background.default,
  height: 48,
  width: '100%',
  margin: `${spacing[2.5]}px 0`,
  padding: `0 ${spacing[20] + spacing[1]}px 0 ${spacing[4]}px`,
  outline: 'none',

  '::placeholder': {
    opacity: 0.65,
  },
});

const sendButtonStyle = css({
  position: 'absolute',
  outline: 'none',
  right: 10,
  top: 10,
  minWidth: 68,
});
