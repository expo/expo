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
  describe('auth().currentUser', () => {
    beforeEach(async () => {
      if (firebase.auth().currentUser) {
        await firebase.auth().signOut();
        await sleep(50);
      }
    });

    describe('getIdToken()', () => {
      it('should return a token', async () => {
        const random = randomString(12, '#aA');
        const email = `${random}@${random}.com`;

        const { user } = await firebase.auth().createUserWithEmailAndPassword(email, random);

        // Test
        const token = await user.getIdToken();

        // Assertions
        token.should.be.a.String();
        token.length.should.be.greaterThan(24);

        // Clean up
        await firebase.auth().currentUser.delete();
      });
    });

    describe('getIdTokenResult()', () => {
      it('should return a valid IdTokenResult Object', async () => {
        const random = randomString(12, '#aA');
        const email = `${random}@${random}.com`;

        const { user } = await firebase.auth().createUserWithEmailAndPassword(email, random);

        // Test
        const tokenResult = await user.getIdTokenResult();

        tokenResult.token.should.be.a.String();
        tokenResult.authTime.should.be.a.String();
        tokenResult.issuedAtTime.should.be.a.String();
        tokenResult.expirationTime.should.be.a.String();

        new Date(tokenResult.authTime).toString().should.not.equal('Invalid Date');
        new Date(tokenResult.issuedAtTime).toString().should.not.equal('Invalid Date');
        new Date(tokenResult.expirationTime).toString().should.not.equal('Invalid Date');

        tokenResult.claims.should.be.a.Object();
        tokenResult.claims.iat.should.be.a.Number();
        tokenResult.claims.iss.should.be.a.String();

        tokenResult.signInProvider.should.equal('password');
        tokenResult.token.length.should.be.greaterThan(24);

        // Clean up
        await firebase.auth().currentUser.delete();
      });
    });

    describe('linkWithCredential()', () => {
      it('should link anonymous account <-> email account', async () => {
        const random = randomString(12, '#aA');
        const email = `${random}@${random}.com`;
        const pass = random;

        await firebase.auth().signInAnonymously();
        const currentUser = firebase.auth().currentUser;

        // Test
        const credential = firebase.auth.EmailAuthProvider.credential(email, pass);

        const linkedUserCredential = await currentUser.linkWithCredential(credential);

        // Assertions
        const linkedUser = linkedUserCredential.user;
        linkedUser.should.be.an.Object();
        linkedUser.should.equal(firebase.auth().currentUser);
        linkedUser.email.toLowerCase().should.equal(email.toLowerCase());
        linkedUser.isAnonymous.should.equal(false);
        linkedUser.providerId.should.equal('firebase');
        linkedUser.providerData.should.be.an.Array();
        linkedUser.providerData.length.should.equal(1);

        // Clean up
        await firebase.auth().currentUser.delete();
      });

      it('should error on link anon <-> email if email already exists', async () => {
        const email = 'test@test.com';
        const pass = 'test1234';

        await firebase.auth().signInAnonymously();
        const currentUser = firebase.auth().currentUser;

        // Test
        try {
          const credential = firebase.auth.EmailAuthProvider.credential(email, pass);
          await currentUser.linkWithCredential(credential);

          // Clean up
          await firebase.auth().signOut();

          // Reject
          return Promise.reject(new Error('Did not error on link'));
        } catch (error) {
          // Assertions
          error.code.should.equal('auth/email-already-in-use');
          error.message.should.equal('The email address is already in use by another account.');

          // Clean up
          await firebase.auth().currentUser.delete();
        }
      });
    });

    describe('linkAndRetrieveDataWithCredential()', () => {
      it('should link anonymous account <-> email account', async () => {
        const random = randomString(12, '#aA');
        const email = `${random}@${random}.com`;
        const pass = random;

        await firebase.auth().signInAnonymously();
        const currentUser = firebase.auth().currentUser;

        // Test
        const credential = firebase.auth.EmailAuthProvider.credential(email, pass);

        const linkedUserCredential = await currentUser.linkAndRetrieveDataWithCredential(
          credential
        );

        // Assertions
        const linkedUser = linkedUserCredential.user;
        linkedUser.should.be.an.Object();
        linkedUser.should.equal(firebase.auth().currentUser);
        linkedUser.email.toLowerCase().should.equal(email.toLowerCase());
        linkedUser.isAnonymous.should.equal(false);
        linkedUser.providerId.should.equal('firebase');
        linkedUser.providerData.should.be.an.Array();
        linkedUser.providerData.length.should.equal(1);

        // Clean up
        await firebase.auth().currentUser.delete();
      });

      it('should error on link anon <-> email if email already exists', async () => {
        const email = 'test@test.com';
        const pass = 'test1234';

        await firebase.auth().signInAnonymously();
        const currentUser = firebase.auth().currentUser;

        // Test
        try {
          const credential = firebase.auth.EmailAuthProvider.credential(email, pass);
          await currentUser.linkAndRetrieveDataWithCredential(credential);

          // Clean up
          await firebase.auth().signOut();

          // Reject
          return Promise.reject(new Error('Did not error on link'));
        } catch (error) {
          // Assertions
          error.code.should.equal('auth/email-already-in-use');
          error.message.should.equal('The email address is already in use by another account.');

          // Clean up
          await firebase.auth().currentUser.delete();
        }
      });
    });

    describe('reauthenticateWithCredential()', () => {
      it('should reauthenticate correctly', async () => {
        const random = randomString(12, '#aA');
        const email = `${random}@${random}.com`;
        const pass = random;

        await firebase.auth().createUserWithEmailAndPassword(email, pass);

        // Test
        const credential = firebase.auth.EmailAuthProvider.credential(email, pass);

        await firebase.auth().currentUser.reauthenticateWithCredential(credential);

        // Assertions
        const currentUser = firebase.auth().currentUser;
        currentUser.email.should.equal(email.toLowerCase());

        // Clean up
        await firebase.auth().currentUser.delete();
      });
    });

    describe('reauthenticateAndRetrieveDataWithCredential()', () => {
      it('should reauthenticate correctly', async () => {
        const random = randomString(12, '#aA');
        const email = `${random}@${random}.com`;
        const pass = random;

        await firebase.auth().createUserAndRetrieveDataWithEmailAndPassword(email, pass);

        // Test
        const credential = firebase.auth.EmailAuthProvider.credential(email, pass);

        await firebase.auth().currentUser.reauthenticateAndRetrieveDataWithCredential(credential);

        // Assertions
        const currentUser = firebase.auth().currentUser;
        currentUser.email.should.equal(email.toLowerCase());

        // Clean up
        await firebase.auth().currentUser.delete();
      });
    });

    describe('reload()', () => {
      it('should not error', async () => {
        await firebase.auth().signInAnonymously();

        try {
          await firebase.auth().currentUser.reload();
          await firebase.auth().signOut();
        } catch (error) {
          // Reject
          await firebase.auth().signOut();
          return Promise.reject(new Error('reload() caused an error', error));
        }
      });
    });

    describe('sendEmailVerification()', () => {
      it('should not error', async () => {
        const random = randomString(12, '#aA');
        const email = `${random}@${random}.com`;
        const pass = random;

        await firebase.auth().createUserAndRetrieveDataWithEmailAndPassword(email, pass);

        try {
          await firebase.auth().currentUser.sendEmailVerification();
          await firebase.auth().currentUser.delete();
        } catch (error) {
          // Reject
          await firebase.auth().currentUser.delete();
          return Promise.reject(new Error('sendEmailVerification() caused an error', error));
        }
      });
    });

    describe('unlink()', () => {
      it('should unlink the email address', async () => {
        const random = randomString(12, '#aA');
        const email = `${random}@${random}.com`;
        const pass = random;

        await firebase.auth().signInAnonymouslyAndRetrieveData();
        const currentUser = firebase.auth().currentUser;

        const credential = firebase.auth.EmailAuthProvider.credential(email, pass);
        await currentUser.linkAndRetrieveDataWithCredential(credential);

        // Test
        await currentUser.unlink(firebase.auth.EmailAuthProvider.PROVIDER_ID);

        // Assertions
        const unlinkedUser = firebase.auth().currentUser;
        unlinkedUser.providerData.should.be.an.Array();
        unlinkedUser.providerData.length.should.equal(0);

        // Clean up
        await firebase.auth().currentUser.delete();
      });
    });

    describe('updateEmail()', () => {
      it('should update the email address', async () => {
        const random = randomString(12, '#aA');
        const random2 = randomString(12, '#aA');
        const email = `${random}@${random}.com`;
        const email2 = `${random2}@${random2}.com`;
        const pass = random;

        // Setup
        await firebase.auth().createUserAndRetrieveDataWithEmailAndPassword(email, pass);
        firebase
          .auth()
          .currentUser.email.toLowerCase()
          .should.equal(email.toLowerCase());

        // Update user email
        await firebase.auth().currentUser.updateEmail(email2);

        // Assertions
        firebase
          .auth()
          .currentUser.email.toLowerCase()
          .should.equal(email2.toLowerCase());

        // Clean up
        await firebase.auth().currentUser.delete();
      });
    });

    describe('updatePassword()', () => {
      it('should update the password', async () => {
        const random = randomString(12, '#aA');
        const random2 = randomString(12, '#aA');
        const email = `${random}@${random}.com`;
        const pass = random;
        const pass2 = random2;

        // Setup
        await firebase.auth().createUserAndRetrieveDataWithEmailAndPassword(email, pass);

        // Update user password
        await firebase.auth().currentUser.updatePassword(pass2);

        // Sign out
        await firebase.auth().signOut();

        // Log in with the new password
        await firebase.auth().signInAndRetrieveDataWithEmailAndPassword(email, pass2);

        // Assertions
        firebase.auth().currentUser.should.be.an.Object();
        firebase.auth().currentUser.email.should.equal(email.toLowerCase());

        // Clean up
        await firebase.auth().currentUser.delete();
      });
    });

    describe('updateProfile()', () => {
      it('should update the profile', async () => {
        const random = randomString(12, '#aA');
        const email = `${random}@${random}.com`;
        const pass = random;
        const displayName = random;
        const photoURL = `http://${random}.com/${random}.jpg`;

        // Setup
        await firebase.auth().createUserAndRetrieveDataWithEmailAndPassword(email, pass);

        // Update user profile
        await firebase.auth().currentUser.updateProfile({
          displayName,
          photoURL,
        });

        // Assertions
        const user = firebase.auth().currentUser;
        user.should.be.an.Object();
        user.email.should.equal(email.toLowerCase());
        user.displayName.should.equal(displayName);
        user.photoURL.should.equal(photoURL);

        // Clean up
        await firebase.auth().currentUser.delete();
      });
    });

    describe('linkWithPhoneNumber()', () => {
      it('should throw an unsupported error', async () => {
        await firebase.auth().signInAnonymouslyAndRetrieveData();
        (() => {
          firebase.auth().currentUser.linkWithPhoneNumber();
        }).should.throw('User.linkWithPhoneNumber() is unsupported by the native Firebase SDKs.');
        await firebase.auth().signOut();
      });
    });

    describe('linkWithPopup()', () => {
      it('should throw an unsupported error', async () => {
        await firebase.auth().signInAnonymouslyAndRetrieveData();
        (() => {
          firebase.auth().currentUser.linkWithPopup();
        }).should.throw('User.linkWithPopup() is unsupported by the native Firebase SDKs.');
        await firebase.auth().signOut();
      });
    });

    describe('linkWithRedirect()', () => {
      it('should throw an unsupported error', async () => {
        await firebase.auth().signInAnonymouslyAndRetrieveData();
        (() => {
          firebase.auth().currentUser.linkWithRedirect();
        }).should.throw('User.linkWithRedirect() is unsupported by the native Firebase SDKs.');
        await firebase.auth().signOut();
      });
    });

    describe('reauthenticateWithPhoneNumber()', () => {
      it('should throw an unsupported error', async () => {
        await firebase.auth().signInAnonymouslyAndRetrieveData();
        (() => {
          firebase.auth().currentUser.reauthenticateWithPhoneNumber();
        }).should.throw(
          'User.reauthenticateWithPhoneNumber() is unsupported by the native Firebase SDKs.'
        );
        await firebase.auth().signOut();
      });
    });

    describe('reauthenticateWithPopup()', () => {
      it('should throw an unsupported error', async () => {
        await firebase.auth().signInAnonymouslyAndRetrieveData();
        (() => {
          firebase.auth().currentUser.reauthenticateWithPopup();
        }).should.throw(
          'User.reauthenticateWithPopup() is unsupported by the native Firebase SDKs.'
        );
        await firebase.auth().signOut();
      });
    });

    describe('reauthenticateWithRedirect()', () => {
      it('should throw an unsupported error', async () => {
        await firebase.auth().signInAnonymouslyAndRetrieveData();
        (() => {
          firebase.auth().currentUser.reauthenticateWithRedirect();
        }).should.throw(
          'User.reauthenticateWithRedirect() is unsupported by the native Firebase SDKs.'
        );
        await firebase.auth().signOut();
      });
    });

    describe('refreshToken', () => {
      it('should throw an unsupported error', async () => {
        await firebase.auth().signInAnonymouslyAndRetrieveData();
        (() => firebase.auth().currentUser.refreshToken).should.throw(
          'User.refreshToken is unsupported by the native Firebase SDKs.'
        );
        await firebase.auth().signOut();
      });
    });
  });
}
