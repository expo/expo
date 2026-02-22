import { Button, mergeClasses } from '@expo/styleguide';
import { isMarketingConsented } from '@expo/styleguide-cookie-consent';
import { Mail01Icon } from '@expo/styleguide-icons/outline/Mail01Icon';
import { useState } from 'react';

import { Input } from '~/ui/components/Form';
import { A, CALLOUT, FOOTNOTE, LABEL } from '~/ui/components/Text';

const PORTAL_ID = '22007177';
const FORM_GUID = '6a213eb9-5e86-4a8e-8607-33f9ac1e07d6';

function getHutk() {
  if (!isMarketingConsented()) {
    return '';
  }
  return (
    document.cookie
      .split('; ')
      .find(cookie => cookie.startsWith('hubspotutk='))
      ?.split('=')[1] ?? ''
  );
}

export const NewsletterSignUp = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userSignedUp, setUserSignedUp] = useState(false);

  async function signUpAsync() {
    if (email.length > 3) {
      const hutk = getHutk();
      const payload = {
        submittedAt: Date.now(),
        fields: [{ name: 'email', value: email }],
        context: {
          hutk: hutk || undefined,
          pageUri: window.location.href,
          pageName: document.title,
        },
      };

      const url = `https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${FORM_GUID}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          setError('Failed to subscribe');
          return;
        }

        setError(null);
        setEmail('');
        setUserSignedUp(true);
      } catch {
        setError('Failed to subscribe');
      }
    }
  }

  return (
    <div className="max-w-[350px] flex-1 max-md-gutters:max-w-full">
      <CALLOUT className="flex items-center gap-2 font-medium text-secondary" id="newsletter-label">
        <Mail01Icon className="shrink-0 text-icon-tertiary" />
        Sign up for the Expo Newsletter
      </CALLOUT>
      <form
        className="relative"
        onSubmit={event => {
          event.preventDefault();
          void signUpAsync();
        }}>
        {userSignedUp ? (
          <LABEL className="my-2.5 flex h-12 items-center">Thank you for the sign up! 💙</LABEL>
        ) : (
          <Input
            onChange={event => {
              setEmail(event.target.value);
              if (event.target.value.length === 0) {
                setError(null);
              }
            }}
            value={email}
            className={mergeClasses('pr-[68px]', error && 'border-danger text-danger')}
            type="email"
            placeholder="reader@email.com"
            aria-labelledby="newsletter-label"
          />
        )}
        {!userSignedUp ? (
          <Button
            size="xs"
            theme={userSignedUp ? 'quaternary' : 'secondary'}
            className="absolute right-2.5 top-2 min-w-[68px]"
            disabled={userSignedUp || email.length === 0}
            onClick={signUpAsync}>
            {userSignedUp ? 'Done!' : 'Sign Up'}
          </Button>
        ) : null}
      </form>
      <FOOTNOTE theme="tertiary">
        Unsubscribe at any time. Read our{' '}
        <A href="https://expo.dev/privacy" openInNewTab>
          privacy policy
        </A>
        .
      </FOOTNOTE>
    </div>
  );
};
