import { render } from '@testing-library/react';
import React from 'react';

import FirebaseRecaptchaVerifierModal from '../FirebaseRecaptchaVerifierModal.web';

jest.mock('firebase/compat/app', () => {
  const firebase = {
    auth: jest.fn(() => ({
      settings: {
        appVerificationDisabledForTesting: undefined,
      },
    })),
  };

  // @ts-ignore
  firebase.auth.RecaptchaVerifier = jest.fn().mockImplementation(() => {
    return {};
  });

  return firebase;
});

describe('FirebaseRecaptchaVerifierModal (Web)', () => {
  test('renders correctly', () => {
    render(<FirebaseRecaptchaVerifierModal />);
  });
});
