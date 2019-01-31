import firebase from 'expo-firebase-app';

describe('storage()', () => {
  describe('ref()', () => {
    describe('toString()', () => {
      it('returns the correct bucket path to the file', () => {
        const app = firebase.app();
        expect(
          firebase
            .storage()
            .ref('/uploadNope.jpeg')
            .toString()
        ).toBe(`gs://${app.options.storageBucket}/uploadNope.jpeg`);
      });
    });

    describe('downloadFile()', () => {
      it('errors if permission denied', async () => {
        try {
          await firebase
            .storage()
            .ref('/not.jpg')
            .downloadFile(`${firebase.storage.Native.DOCUMENT_DIRECTORY_PATH}/not.jpg`);
          return Promise.reject(new Error('No permission denied error'));
        } catch (error) {
          expect(error.code).toBe('storage/unauthorized');
          expect(error.message.includes('not authorized')).toBeTruthy();
          return Promise.resolve();
        }
      });

      it('downloads a file', async () => {
        const meta = await firebase
          .storage()
          .ref('/ok.jpeg')
          .downloadFile(`${firebase.storage.Native.DOCUMENT_DIRECTORY_PATH}/ok.jpeg`);

        expect(meta.state).toBe(firebase.storage.TaskState.SUCCESS);
        expect(meta.bytesTransferred).toBe(meta.totalBytes);
      });
    });

    describe('putFile()', () => {
      beforeEach(async () => {
        await firebase
          .storage()
          .ref('/ok.jpeg')
          .downloadFile(`${firebase.storage.Native.DOCUMENT_DIRECTORY_PATH}/ok.jpeg`);
        await firebase
          .storage()
          .ref('/cat.gif')
          .downloadFile(`${firebase.storage.Native.DOCUMENT_DIRECTORY_PATH}/cat.gif`);
        await firebase
          .storage()
          .ref('/hei.heic')
          .downloadFile(`${firebase.storage.Native.DOCUMENT_DIRECTORY_PATH}/hei.heic`);
      });

      it('errors if permission denied', async () => {
        try {
          await firebase
            .storage()
            .ref('/uploadNope.jpeg')
            .putFile(`${firebase.storage.Native.DOCUMENT_DIRECTORY_PATH}/ok.jpeg`);
          return Promise.reject(new Error('No permission denied error'));
        } catch (error) {
          expect(error.code).toBe('storage/unauthorized');
          expect(error.message.includes('not authorized')).toBeTruthy();
          return Promise.resolve();
        }
      });

      it('uploads a file', async () => {
        const uploadTaskSnapshot = await firebase
          .storage()
          .ref('/uploadOk.jpeg')
          .putFile(`${firebase.storage.Native.DOCUMENT_DIRECTORY_PATH}/ok.jpeg`);

        await firebase
          .storage()
          .ref('/uploadCat.gif')
          .putFile(`${firebase.storage.Native.DOCUMENT_DIRECTORY_PATH}/cat.gif`);

        await firebase
          .storage()
          .ref('/uploadHei.heic')
          .putFile(`${firebase.storage.Native.DOCUMENT_DIRECTORY_PATH}/hei.heic`);

        expect(uploadTaskSnapshot.state).toBe(firebase.storage.TaskState.SUCCESS);
        expect(uploadTaskSnapshot.bytesTransferred).toBe(uploadTaskSnapshot.totalBytes);
        expect(typeof uploadTaskSnapshot.metadata).toBe('object');
        expect(typeof uploadTaskSnapshot.downloadURL).toBe('string');
      });

      it('uploads a file without read permission', async () => {
        const uploadTaskSnapshot = await firebase
          .storage()
          .ref('/writeOnly.jpeg')
          .putFile(`${firebase.storage.Native.DOCUMENT_DIRECTORY_PATH}/ok.jpeg`);

        expect(uploadTaskSnapshot.state).toBe(firebase.storage.TaskState.SUCCESS);
        expect(uploadTaskSnapshot.bytesTransferred).toBe(uploadTaskSnapshot.totalBytes);
        expect(typeof uploadTaskSnapshot.metadata).toBe('object');
        expect(uploadTaskSnapshot.downloadURL).toBeUndefined();
      });
    });

    describe('on()', () => {
      beforeEach(async () => {
        await firebase
          .storage()
          .ref('/ok.jpeg')
          .downloadFile(`${firebase.storage.Native.DOCUMENT_DIRECTORY_PATH}/ok.jpeg`);
      });

      it('listens to upload state', () => {
        return new Promise(resolve => {
          const path = `${firebase.storage.Native.DOCUMENT_DIRECTORY_PATH}/ok.jpeg`;
          const ref = firebase.storage().ref('/uploadOk.jpeg');

          const unsubscribe = ref.putFile(path).on(
            firebase.storage.TaskEvent.STATE_CHANGED,
            snapshot => {
              if (snapshot.state === firebase.storage.TaskState.SUCCESS) {
                resolve();
              }
            },
            error => {
              unsubscribe();
              throw error;
            }
          );
        });
      });
    });
  });
});
