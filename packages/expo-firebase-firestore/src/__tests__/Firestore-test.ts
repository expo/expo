import firebase from 'expo-firebase-app';

describe('firestore()', () => {
  describe('collection()', () => {
    it('should create CollectionReference with the right id', () => {
      firebase
        .firestore()
        .collection('collection1/doc1/collection2')
        .id.should.equal('collection2');
    });

    it('should error if invalid collection path supplied', () => {
      expect(firebase.firestore().collection('collection1/doc1')).toThrow(
        'Argument "collectionPath" must point to a collection.'
      );
    });
  });

  describe('doc()', () => {
    it('should create DocumentReference with correct path', () => {
      firebase
        .firestore()
        .doc('collection1/doc1/collection2/doc2')
        .path.should.equal('collection1/doc1/collection2/doc2');
    });

    it('should error if invalid document path supplied', () => {
      expect(firebase.firestore().doc('collection1')).toThrow(
        'Argument "documentPath" must point to a document.'
      );
    });
  });

  describe('disable/enableNetwork()', () => {
    it('calls without error', async () => {
      await firebase.firestore().disableNetwork();
      await firebase.firestore().enableNetwork();
    });
  });

  describe('enablePersistence()', () => {
    it('calls without error', async () => {
      await firebase.firestore().enablePersistence();
    });
  });

  describe('setLogLevel()', () => {
    it('should set level from string', () => {
      firebase.firestore.setLogLevel('debug');
      firebase.firestore.setLogLevel('error');
      firebase.firestore.setLogLevel('silent');
      // test deprecated method
      firebase.firestore.enableLogging(true);
      firebase.firestore.enableLogging(false);
    });

    it('should throw an invalid parameter error', () => {
      expect(firebase.firestore.setLogLevel('warn')).toThrow(
        'Argument `logLevel` must be one of: `debug`, `error`, `silent`'
      );
    });
  });

  describe('settings()', () => {
    it('should reject invalid object', async () => {
      try {
        await firebase.firestore().settings('test');
      } catch (error) {
        return Promise.resolve();
      }

      return Promise.reject(new Error('Did not error on invalid object'));
    });

    it('should reject invalid host setting', async () => {
      try {
        await firebase.firestore().settings({ host: true });
      } catch (error) {
        return Promise.resolve();
      }

      return Promise.reject(new Error('Did not error on invalid `host` setting'));
    });

    it('should reject invalid persistence setting', async () => {
      try {
        await firebase.firestore().settings({ persistence: 'fail' });
      } catch (error) {
        return Promise.resolve();
      }

      return Promise.reject(new Error('Did not error on invalid `persistence` setting'));
    });

    it('should reject invalid ssl setting', async () => {
      try {
        await firebase.firestore().settings({ ssl: 'fail' });
      } catch (error) {
        return Promise.resolve();
      }

      return Promise.reject(new Error('Did not error on invalid `ssl` setting'));
    });

    it('should reject invalid timestampsInSnapshots setting', async () => {
      try {
        await firebase.firestore().settings({ timestampsInSnapshots: 'fail' });
      } catch (error) {
        return Promise.resolve();
      }

      return Promise.reject(new Error('Did not error on invalid `timestampsInSnapshots` setting'));
    });
  });
});
