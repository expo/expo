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
  helpers: { sleep },
}) {
  describe('auth() -> Providers', () => {
    beforeEach(async () => {
      if (firebase.auth().currentUser) {
        await firebase.auth().signOut();
        await sleep(50);
      }
    });

    describe('EmailAuthProvider', () => {
      describe('constructor', () => {
        it('should throw an unsupported error', () => {
          (() => new firebase.auth.EmailAuthProvider()).should.throw(
            '`new EmailAuthProvider()` is not supported on the native Firebase SDKs.'
          );
        });
      });

      describe('credential', () => {
        it('should return a credential object', () => {
          const email = 'email@email.com';
          const password = 'password';
          const credential = firebase.auth.EmailAuthProvider.credential(email, password);
          credential.providerId.should.equal('password');
          credential.token.should.equal(email);
          credential.secret.should.equal(password);
        });
      });

      describe('credentialWithLink', () => {
        it('should return a credential object', () => {
          const email = 'email@email.com';
          const link = 'link';
          const credential = firebase.auth.EmailAuthProvider.credentialWithLink(email, link);
          credential.providerId.should.equal('emailLink');
          credential.token.should.equal(email);
          credential.secret.should.equal(link);
        });
      });

      describe('EMAIL_PASSWORD_SIGN_IN_METHOD', () => {
        it('should return password', () => {
          firebase.auth.EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD.should.equal('password');
        });
      });

      describe('EMAIL_LINK_SIGN_IN_METHOD', () => {
        it('should return emailLink', () => {
          firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD.should.equal('emailLink');
        });
      });

      describe('PROVIDER_ID', () => {
        it('should return password', () => {
          firebase.auth.EmailAuthProvider.PROVIDER_ID.should.equal('password');
        });
      });
    });

    describe('FacebookAuthProvider', () => {
      describe('constructor', () => {
        it('should throw an unsupported error', () => {
          (() => new firebase.auth.FacebookAuthProvider()).should.throw(
            '`new FacebookAuthProvider()` is not supported on the native Firebase SDKs.'
          );
        });
      });

      describe('credential', () => {
        it('should return a credential object', () => {
          const token = '123456';
          const credential = firebase.auth.FacebookAuthProvider.credential(token);
          credential.providerId.should.equal('facebook.com');
          credential.token.should.equal(token);
          credential.secret.should.equal('');
        });
      });

      describe('PROVIDER_ID', () => {
        it('should return facebook.com', () => {
          firebase.auth.FacebookAuthProvider.PROVIDER_ID.should.equal('facebook.com');
        });
      });
    });

    describe('GithubAuthProvider', () => {
      describe('constructor', () => {
        it('should throw an unsupported error', () => {
          (() => new firebase.auth.GithubAuthProvider()).should.throw(
            '`new GithubAuthProvider()` is not supported on the native Firebase SDKs.'
          );
        });
      });

      describe('credential', () => {
        it('should return a credential object', () => {
          const token = '123456';
          const credential = firebase.auth.GithubAuthProvider.credential(token);
          credential.providerId.should.equal('github.com');
          credential.token.should.equal(token);
          credential.secret.should.equal('');
        });
      });

      describe('PROVIDER_ID', () => {
        it('should return github.com', () => {
          firebase.auth.GithubAuthProvider.PROVIDER_ID.should.equal('github.com');
        });
      });
    });

    describe('GoogleAuthProvider', () => {
      describe('constructor', () => {
        it('should throw an unsupported error', () => {
          (() => new firebase.auth.GoogleAuthProvider()).should.throw(
            '`new GoogleAuthProvider()` is not supported on the native Firebase SDKs.'
          );
        });
      });

      describe('credential', () => {
        it('should return a credential object', () => {
          const token = '123456';
          const secret = '654321';
          const credential = firebase.auth.GoogleAuthProvider.credential(token, secret);
          credential.providerId.should.equal('google.com');
          credential.token.should.equal(token);
          credential.secret.should.equal(secret);
        });
      });

      describe('PROVIDER_ID', () => {
        it('should return google.com', () => {
          firebase.auth.GoogleAuthProvider.PROVIDER_ID.should.equal('google.com');
        });
      });
    });

    describe('OAuthProvider', () => {
      describe('constructor', () => {
        it('should throw an unsupported error', () => {
          (() => new firebase.auth.OAuthProvider()).should.throw(
            '`new OAuthProvider()` is not supported on the native Firebase SDKs.'
          );
        });
      });

      describe('credential', () => {
        it('should return a credential object', () => {
          const idToken = '123456';
          const accessToken = '654321';
          const credential = firebase.auth.OAuthProvider.credential(idToken, accessToken);
          credential.providerId.should.equal('oauth');
          credential.token.should.equal(idToken);
          credential.secret.should.equal(accessToken);
        });
      });

      describe('PROVIDER_ID', () => {
        it('should return oauth', () => {
          firebase.auth.OAuthProvider.PROVIDER_ID.should.equal('oauth');
        });
      });
    });

    describe('PhoneAuthProvider', () => {
      describe('constructor', () => {
        it('should throw an unsupported error', () => {
          (() => new firebase.auth.PhoneAuthProvider()).should.throw(
            '`new PhoneAuthProvider()` is not supported on the native Firebase SDKs.'
          );
        });
      });

      describe('credential', () => {
        it('should return a credential object', () => {
          const verificationId = '123456';
          const code = '654321';
          const credential = firebase.auth.PhoneAuthProvider.credential(verificationId, code);
          credential.providerId.should.equal('phone');
          credential.token.should.equal(verificationId);
          credential.secret.should.equal(code);
        });
      });

      describe('PROVIDER_ID', () => {
        it('should return phone', () => {
          firebase.auth.PhoneAuthProvider.PROVIDER_ID.should.equal('phone');
        });
      });
    });

    describe('TwitterAuthProvider', () => {
      describe('constructor', () => {
        it('should throw an unsupported error', () => {
          (() => new firebase.auth.TwitterAuthProvider()).should.throw(
            '`new TwitterAuthProvider()` is not supported on the native Firebase SDKs.'
          );
        });
      });

      describe('credential', () => {
        it('should return a credential object', () => {
          const token = '123456';
          const secret = '654321';
          const credential = firebase.auth.TwitterAuthProvider.credential(token, secret);
          credential.providerId.should.equal('twitter.com');
          credential.token.should.equal(token);
          credential.secret.should.equal(secret);
        });
      });

      describe('PROVIDER_ID', () => {
        it('should return twitter.com', () => {
          firebase.auth.TwitterAuthProvider.PROVIDER_ID.should.equal('twitter.com');
        });
      });
    });
  });
}
