import { Button, mergeClasses } from '@expo/styleguide';
import { Mail01Icon } from '@expo/styleguide-icons';
import { useEffect, useState } from 'react';

import { useLocalStorage } from '~/common/useLocalStorage';
import { Input } from '~/ui/components/Form';
import { A, CALLOUT, FOOTNOTE } from '~/ui/components/Text';

const isDev = process.env.NODE_ENV === 'development';
const URL = isDev
  ? `https://api.expo.dev/v2/mailchimp-mailing-list/subscribe`
  : `http://api.expo.test/v2/mailchimp-mailing-list/subscribe`;

export const NewsletterSignUp = () => {
  const [hasSubscribed, setHasSubscribed] = useLocalStorage({
    defaultValue: false,
    name: 'SUBSCRIBED_TO_NEWSLETTER',
  });

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userSignedUp, setUserSignedUp] = useState(hasSubscribed);

  useEffect(() => setUserSignedUp(hasSubscribed), [hasSubscribed]);

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
            setHasSubscribed(true);
          }
        })
        .catch(setError);
    }
  }

  return (
    <div className="flex-1 max-w-[400px] max-md-gutters:max-w-full">
      <CALLOUT theme="secondary" weight="medium" className="flex gap-2 items-center">
        <Mail01Icon className="text-icon-tertiary" />
        Sign up for developer updates
      </CALLOUT>
      <form
        className="relative"
        onSubmit={event => {
          event.preventDefault();
          signUp();
        }}>
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
          placeholder={userSignedUp ? 'Thank you for the sign up!' : 'your@email.com'}
          disabled={userSignedUp}
        />
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
