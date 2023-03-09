import { css } from '@emotion/react';
import { Button, shadows, theme } from '@expo/styleguide';
import { borderRadius, spacing } from '@expo/styleguide-base';
import { useState } from 'react';

import { A, CALLOUT, FOOTNOTE } from '../Text';

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
          size="xs"
          theme={userSignedUp ? 'quaternary' : 'secondary'}
          css={sendButtonStyle}
          disabled={userSignedUp || !email.length}
          onClick={() => {
            setEmail('');
            setUserSignedUp(true);
          }}>
          {userSignedUp ? 'Done!' : 'Sign Up'}
        </Button>
      </div>
      <FOOTNOTE theme="secondary">
        Unsubscribe at any time. Read our{' '}
        <A href="https://expo.dev/privacy" openInNewTab>
          privacy policy
        </A>
        .
      </FOOTNOTE>
    </div>
  );
};

const wrapperStyle = css({
  flex: 1,
  maxWidth: 400,
});

const inputWrapperStyle = css({
  position: 'relative',
});

const buttonMinWidth = spacing[16] + spacing[1];

const inputStyle = css({
  display: 'block',
  boxSizing: 'border-box',
  boxShadow: shadows.xs,
  border: `1px solid ${theme.border.default}`,
  borderRadius: borderRadius.sm,
  color: theme.text.default,
  background: theme.background.default,
  height: 48,
  width: '100%',
  margin: `${spacing[2.5]}px 0`,
  padding: `0 ${buttonMinWidth + spacing[4]}px 0 ${spacing[4]}px`,
  outline: 'none',

  '::placeholder': {
    opacity: 0.65,
  },
});

const sendButtonStyle = css({
  position: 'absolute',
  outline: 'none',
  right: 10,
  top: 8,
  minWidth: buttonMinWidth,
});
