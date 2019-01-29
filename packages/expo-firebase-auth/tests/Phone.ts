import { User } from 'expo-firebase-auth';

const TEST_PHONE_A = '+';
const TEST_CODE_A = '123456';

const TEST_PHONE_B = '+';
const TEST_CODE_B = '654321';

export default function test({
  describe,
  firebase,
  xdescribe,
  it,
  xit,
  beforeEach,
  expect,
  jasmine,
  should,
  helpers: { sleep },
}) {
  describe('auth() => Phone', async () => {
    // iOS
    firebase.auth().settings.appVerificationDisabledForTesting = true;

    // android
    await firebase.auth().settings.setAutoRetrievedSmsCodeForPhoneNumber(TEST_PHONE_A, TEST_CODE_A);

    await sleep(50);

    beforeEach(async () => {
      if (firebase.auth().currentUser) {
        await firebase.auth().signOut();
        await sleep(50);
      }
    });

    describe('signInWithPhoneNumber', () => {
      it('signs in with a valid code', async () => {
        const confirmResult = await firebase.auth().signInWithPhoneNumber(TEST_PHONE_A);

        confirmResult.verificationId.should.be.a.String();

        should.ok(confirmResult.verificationId.length, 'verificationId string should not be empty');

        confirmResult.confirm.should.be.a.Function();

        const user = await confirmResult.confirm(TEST_CODE_A);

        user.should.be.instanceOf(User);

        user.phoneNumber.should.equal(TEST_PHONE_A);
      });

      it('errors on invalid code', async () => {
        const confirmResult = await firebase.auth().signInWithPhoneNumber(TEST_PHONE_A);

        confirmResult.verificationId.should.be.a.String();

        should.ok(confirmResult.verificationId.length, 'verificationId string should not be empty');

        confirmResult.confirm.should.be.a.Function();

        await confirmResult.confirm('666999').should.be.rejected();
        // TODO test error code and message
      });
    });
  });
}
