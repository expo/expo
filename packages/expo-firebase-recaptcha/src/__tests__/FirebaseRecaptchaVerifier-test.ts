import FirebaseRecaptchaVerifier from '../FirebaseRecaptchaVerifier';

const token = '123456789';

/* More tests are in test-suite */

it(`constructs`, async () => {
  const verifier = new FirebaseRecaptchaVerifier(token);
  expect(verifier).toBeDefined();
});

it(`returns type "recaptcha"`, async () => {
  const verifier = new FirebaseRecaptchaVerifier(token);
  expect(verifier.type).toBe('recaptcha');
});

it(`returns valid token`, async () => {
  const verifier = new FirebaseRecaptchaVerifier(token);
  const resultToken = await verifier.verify();
  expect(resultToken).toBe(token);
});
