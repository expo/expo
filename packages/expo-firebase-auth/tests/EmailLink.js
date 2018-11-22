export default function test({
  describe,
  xdescribe,
  it,
  xit,
  beforeEach,
  expect,
  jasmine,
  firebase,
  should,
  helpers: { randomString, sleep },
}) {
  describe('auth() -> emailLink Provider', () => {
    beforeEach(async () => {
      if (firebase.auth().currentUser) {
        await firebase.auth().signOut();
        await sleep(50);
      }
    });

    describe('sendSignInLinkToEmail', () => {
      it('should send email', async () => {
        const random = randomString(12, '#aA');
        const email = `${random}@${random}.com`;
        // const email = 'MANUAL TEST EMAIL HERE';
        const actionCodeSettings = {
          url: 'http://localhost:1337/authLinkFoo?bar=1234',
          handleCodeInApp: true,
          iOS: {
            bundleId: 'com.testing',
          },
          android: {
            packageName: 'com.testing',
            installApp: true,
            minimumVersion: '12',
          },
        };
        await firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings);
      });
    });

    describe('isSignInWithEmailLink', () => {
      it('should return true/false', async () => {
        const emailLink1 = 'https://www.example.com/action?mode=signIn&oobCode=oobCode';
        const emailLink2 = 'https://www.example.com/action?mode=verifyEmail&oobCode=oobCode';
        const emailLink3 = 'https://www.example.com/action?mode=signIn';
        const emailLink4 =
          'https://x59dg.app.goo.gl/?link=https://rnfirebase-b9ad4.firebaseapp.com/__/auth/action?apiKey%3Dfoo%26mode%3DsignIn%26oobCode%3Dbar';

        should.equal(true, firebase.auth().isSignInWithEmailLink(emailLink1));
        should.equal(false, firebase.auth().isSignInWithEmailLink(emailLink2));
        should.equal(false, firebase.auth().isSignInWithEmailLink(emailLink3));
        should.equal(true, firebase.auth().isSignInWithEmailLink(emailLink4));
      });
    });

    // FOR MANUAL TESTING ONLY
    xdescribe('signInWithEmailLink', () => {
      it('should signIn', async () => {
        const email = 'MANUAL TEST EMAIL HERE';
        const emailLink = 'MANUAL TEST CODE HERE';

        const userCredential = await firebase.auth().signInWithEmailLink(email, emailLink);

        userCredential.user.email.should.equal(email);

        await await firebase.auth().signOut();
      });
    });
  });
}
