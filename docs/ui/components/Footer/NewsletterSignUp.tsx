import { Button, mergeClasses } from '@expo/styleguide';
import { Mail01Icon } from '@expo/styleguide-icons/outline/Mail01Icon';
import { useState } from 'react';

import { Input } from '~/ui/components/Form';
import { A, CALLOUT, FOOTNOTE, LABEL } from '~/ui/components/Text';

const isDev = process.env.NODE_ENV === 'development';
const URL = isDev
  ? `http://api.expo.test/v2/mailchimp-mailing-list/subscribe`
  : `https://api.expo.dev/v2/mailchimp-mailing-list/subscribe`;

export const NewsletterSignUp = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userSignedUp, setUserSignedUp] = useState(false);

  function signUp() {
    if (email.length > 3) {
      fetch(URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
        .then(res => res.json())
        .then(res => {
          if (res.errors) {
            setError(res.errors);
          } else {
            setError(null);
            setEmail('');
            setUserSignedUp(true);
          }
        })
        .catch(setError);
    }
  }

  return (
    <div className="flex-1 max-w-[350px] max-md-gutters:max-w-full">
      <CALLOUT className="text-secondary font-medium flex gap-2 items-center" id="newsletter-label">
        <Mail01Icon className="text-icon-tertiary shrink-0" />
        Sign up for the Expo Newsletter
      </CALLOUT>
      <form
        className="relative"
        onSubmit={event => {
          event.preventDefault();
          signUp();
        }}>
        {userSignedUp ? (
          <LABEL className="flex items-center my-2.5 h-12">Thank you for the sign up! 💙</LABEL>
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
            disabled={userSignedUp || !email.length}
            onClick={signUp}>
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
