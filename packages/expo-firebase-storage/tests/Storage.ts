export default function test({
  should,
  describe,
  xdescribe,
  it,
  xit,
  beforeEach: before,
  expect,
  jasmine,
  firebase,
}) {
  describe('storage()', () => {
    describe('ref()', () => {
      describe('toString()', () => {
        it('returns the correct bucket path to the file', () => {
          const app = firebase.app();
          firebase
            .storage()
            .ref('/uploadNope.jpeg')
            .toString()
            .should.equal(`gs://${app.options.storageBucket}/uploadNope.jpeg`);
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
            error.code.should.equal('storage/unauthorized');
            error.message.includes('not authorized').should.be.true();
            return Promise.resolve();
          }
        });

        it('downloads a file', async () => {
          const meta = await firebase
            .storage()
            .ref('/ok.jpeg')
            .downloadFile(`${firebase.storage.Native.DOCUMENT_DIRECTORY_PATH}/ok.jpeg`);

          meta.state.should.eql(firebase.storage.TaskState.SUCCESS);
          meta.bytesTransferred.should.eql(meta.totalBytes);
        });
      });

      describe('putFile()', () => {
        before(async () => {
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
            error.code.should.equal('storage/unauthorized');
            error.message.includes('not authorized').should.be.true();
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

          uploadTaskSnapshot.state.should.eql(firebase.storage.TaskState.SUCCESS);
          uploadTaskSnapshot.bytesTransferred.should.eql(uploadTaskSnapshot.totalBytes);
          uploadTaskSnapshot.metadata.should.be.an.Object();
          uploadTaskSnapshot.downloadURL.should.be.a.String();
        });

        it('uploads a file without read permission', async () => {
          const uploadTaskSnapshot = await firebase
            .storage()
            .ref('/writeOnly.jpeg')
            .putFile(`${firebase.storage.Native.DOCUMENT_DIRECTORY_PATH}/ok.jpeg`);

          uploadTaskSnapshot.state.should.eql(firebase.storage.TaskState.SUCCESS);
          uploadTaskSnapshot.bytesTransferred.should.eql(uploadTaskSnapshot.totalBytes);
          uploadTaskSnapshot.metadata.should.be.an.Object();
          should.not.exist(uploadTaskSnapshot.downloadURL);
        });
      });

      describe('on()', () => {
        before(async () => {
          await firebase
            .storage()
            .ref('/ok.jpeg')
            .downloadFile(`${firebase.storage.Native.DOCUMENT_DIRECTORY_PATH}/ok.jpeg`);
        });

        it('listens to upload state', () => {
          const { resolve, reject, promise } = Promise.defer();
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
              reject(error);
            }
          );

          return promise;
        });
      });
    });
  });
}
