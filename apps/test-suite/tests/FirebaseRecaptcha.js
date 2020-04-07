import { FirebaseRecaptcha, FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import React from 'react';

import { mountAndWaitFor as originalMountAndWaitFor } from './helpers';

export const name = 'FirebaseRecaptcha';

const style = { width: 200, height: 200 };

const firebaseConfig = {};

export async function test(
  { it, describe, beforeAll, jasmine, afterAll, expect, afterEach, beforeEach },
  { setPortalChild, cleanupPortal }
) {
  afterEach(async () => {
    await cleanupPortal();
  });

  const mountAndWaitFor = (child, propName = 'onLayout') =>
    originalMountAndWaitFor(child, propName, setPortalChild);

  describe(name, () => {
    describe('FirebaseRecaptcha', () => {
      it(`mounts`, async () => {
        await mountAndWaitFor(<FirebaseRecaptcha style={style} firebaseConfig={firebaseConfig} />);
      });
    });

    describe('FirebaseRecaptchaVerifierModal', () => {
      it(`mounts`, async () => {
        await mountAndWaitFor(
          <FirebaseRecaptchaVerifierModal
            ref={ref => (ref ? ref.verify() : undefined)}
            style={style}
            firebaseConfig={firebaseConfig}
          />
        );
      });
    });
  });
}
