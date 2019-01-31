import firebase from 'expo-firebase-app';

export default function test({ helpers: { sleep } }) {
  describe('iid()', () => {
    describe('get()', () => {
      it('returns instance id string', async () => {
        const iid = await firebase.iid().get();
        expect(iid).toBeInstanceOf(String);
      });
    });

    describe('delete()', () => {
      it('deletes the current instance id', async () => {
        const iidBefore = await firebase.iid().get();
        expect(typeof iidBefore).toBe('string');
        await firebase.iid().delete();

        const iidAfter = await firebase.iid().get();
        expect(typeof iidAfter).toBe('string');
        expect(iidBefore).not.toBe(iidAfter);
        await sleep(2000);
      });
    });

    describe('getToken()', () => {
      it('should return an FCM token from getToken with arguments', async () => {
        const authorizedEntity = firebase.iid().app.options.messagingSenderId;
        const token = await firebase.iid().getToken(authorizedEntity, '*');
        expect(token).toBeInstanceOf(String);
      });

      it('should return an FCM token from getToken without arguments', async () => {
        const token = await firebase.iid().getToken();
        expect(token).toBeInstanceOf(String);
      });

      it('should return an FCM token from getToken with 1 argument', async () => {
        const authorizedEntity = firebase.iid().app.options.messagingSenderId;

        const token = await firebase.iid().getToken(authorizedEntity);
        expect(token).toBeInstanceOf(String);
      });
    });

    describe('deleteToken()', () => {
      it('should return nil from deleteToken with arguments', async () => {
        const authorizedEntity = firebase.iid().app.options.messagingSenderId;
        const token = await firebase.iid().deleteToken(authorizedEntity, '*');
        expect(token).toBeUndefined();
      });

      it('should return nil from deleteToken without arguments', async () => {
        const token = await firebase.iid().deleteToken();
        expect(token).toBeUndefined();
      });

      it('should return nil from deleteToken with 1 argument', async () => {
        const authorizedEntity = firebase.iid().app.options.messagingSenderId;
        const token = await firebase.iid().deleteToken(authorizedEntity);
        expect(token).toBeUndefined();
      });
    });
  });
}
