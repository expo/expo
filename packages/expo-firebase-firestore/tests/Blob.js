export default function test({
  should,
  describe,
  xdescribe,
  it,
  xit,
  beforeEach,
  expect,
  jasmine,
  firebase,
  testRunId,
}) {
  const testObject = { hello: 'world', testRunId };
  const testString = JSON.stringify(testObject);
  const testBuffer = Buffer.from(testString);
  const testBase64 = testBuffer.toString('base64');

  const testObjectLarge = new Array(5000).fill(testObject);
  const testStringLarge = JSON.stringify(testObjectLarge);
  const testBufferLarge = Buffer.from(testStringLarge);
  const testBase64Large = testBufferLarge.toString('base64');
  /** ----------------
   *    CLASS TESTS
   * -----------------*/
  beforeEach(() => {
    // needs to be called before any usage of firestore
    // await firebase.firestore().settings({ persistence: true });
    // await firebase.firestore().settings({ persistence: false });
  });

  describe('firestore', () => {
    it('should export Blob class on statics', async () => {
      const { Blob } = firebase.firestore;
      should.exist(Blob);
    });

    describe('Blob', () => {
      it('.constructor() -> returns new instance of Blob', async () => {
        const { Blob } = firebase.firestore;
        const myBlob = new Blob(testStringLarge);
        myBlob.should.be.instanceOf(Blob);
        myBlob._binaryString.should.equal(testStringLarge);
        myBlob.toBase64().should.equal(testBase64Large);
      });

      it('.fromBase64String() -> returns new instance of Blob', async () => {
        const { Blob } = firebase.firestore;
        const myBlob = Blob.fromBase64String(testBase64);
        myBlob.should.be.instanceOf(Blob);
        myBlob._binaryString.should.equal(testString);
        should.deepEqual(
          JSON.parse(myBlob._binaryString),
          testObject,
          'Expected Blob _binaryString internals to serialize to json and match test object'
        );
      });

      it('.fromBase64String() -> throws if arg not typeof string and length > 0', async () => {
        const { Blob } = firebase.firestore;
        const myBlob = Blob.fromBase64String(testBase64);
        myBlob.should.be.instanceOf(Blob);
        (() => Blob.fromBase64String(1234)).should.throwError();
        (() => Blob.fromBase64String('')).should.throwError();
      });

      it('.fromUint8Array() -> returns new instance of Blob', async () => {
        const testUInt8Array = new Uint8Array(testBuffer);
        const { Blob } = firebase.firestore;
        const myBlob = Blob.fromUint8Array(testUInt8Array);
        myBlob.should.be.instanceOf(Blob);
        const json = JSON.parse(myBlob._binaryString);
        json.hello.should.equal('world');
      });

      it('.fromUint8Array() -> throws if arg not instanceof Uint8Array', async () => {
        const testUInt8Array = new Uint8Array(testBuffer);
        const { Blob } = firebase.firestore;
        const myBlob = Blob.fromUint8Array(testUInt8Array);
        myBlob.should.be.instanceOf(Blob);
        (() => Blob.fromUint8Array('derp')).should.throwError();
      });
    });

    describe('Blob instance', () => {
      it('.toString() -> returns string representation of blob instance', async () => {
        const { Blob } = firebase.firestore;
        const myBlob = Blob.fromBase64String(testBase64);
        myBlob.should.be.instanceOf(Blob);
        should.equal(
          myBlob.toString().includes(testBase64),
          true,
          'toString() should return a string that includes the base64'
        );
      });

      it('.isEqual() -> returns true or false', async () => {
        const { Blob } = firebase.firestore;
        const myBlob = Blob.fromBase64String(testBase64);
        const myBlob2 = Blob.fromBase64String(testBase64Large);
        myBlob.isEqual(myBlob).should.equal(true);
        myBlob2.isEqual(myBlob).should.equal(false);
      });

      it('.isEqual() -> throws if arg not instanceof Blob', async () => {
        const { Blob } = firebase.firestore;
        const myBlob = Blob.fromBase64String(testBase64);
        const myBlob2 = Blob.fromBase64String(testBase64Large);
        myBlob.isEqual(myBlob).should.equal(true);
        (() => myBlob2.isEqual('derp')).should.throwError();
      });

      it('.toBase64() -> returns base64 string', async () => {
        const { Blob } = firebase.firestore;
        const myBlob = Blob.fromBase64String(testBase64);
        myBlob.should.be.instanceOf(Blob);
        myBlob.toBase64().should.equal(testBase64);
      });

      it('.toUint8Array() -> returns Uint8Array', async () => {
        const { Blob } = firebase.firestore;
        const myBlob = Blob.fromBase64String(testBase64);
        const testUInt8Array = new Uint8Array(testBuffer);
        const testUInt8Array2 = new Uint8Array();

        myBlob.should.be.instanceOf(Blob);
        should.deepEqual(myBlob.toUint8Array(), testUInt8Array);
        should.notDeepEqual(myBlob.toUint8Array(), testUInt8Array2);
      });
    });
    it('should export Blob class on statics', async () => {
      const { Blob } = firebase.firestore;
      should.exist(Blob);
    });

    describe('Blob', () => {
      it('.constructor() -> returns new instance of Blob', async () => {
        const { Blob } = firebase.firestore;
        const myBlob = new Blob(testStringLarge);
        myBlob.should.be.instanceOf(Blob);
        myBlob._binaryString.should.equal(testStringLarge);
        myBlob.toBase64().should.equal(testBase64Large);
      });

      it('.fromBase64String() -> returns new instance of Blob', async () => {
        const { Blob } = firebase.firestore;
        const myBlob = Blob.fromBase64String(testBase64);
        myBlob.should.be.instanceOf(Blob);
        myBlob._binaryString.should.equal(testString);
        should.deepEqual(
          JSON.parse(myBlob._binaryString),
          testObject,
          'Expected Blob _binaryString internals to serialize to json and match test object'
        );
      });

      it('.fromBase64String() -> throws if arg not typeof string and length > 0', async () => {
        const { Blob } = firebase.firestore;
        const myBlob = Blob.fromBase64String(testBase64);
        myBlob.should.be.instanceOf(Blob);
        (() => Blob.fromBase64String(1234)).should.throwError();
        (() => Blob.fromBase64String('')).should.throwError();
      });

      it('.fromUint8Array() -> returns new instance of Blob', async () => {
        const testUInt8Array = new Uint8Array(testBuffer);
        const { Blob } = firebase.firestore;
        const myBlob = Blob.fromUint8Array(testUInt8Array);
        myBlob.should.be.instanceOf(Blob);
        const json = JSON.parse(myBlob._binaryString);
        json.hello.should.equal('world');
      });

      it('.fromUint8Array() -> throws if arg not instanceof Uint8Array', async () => {
        const testUInt8Array = new Uint8Array(testBuffer);
        const { Blob } = firebase.firestore;
        const myBlob = Blob.fromUint8Array(testUInt8Array);
        myBlob.should.be.instanceOf(Blob);
        (() => Blob.fromUint8Array('derp')).should.throwError();
      });
    });

    describe('Blob instance', () => {
      it('.toString() -> returns string representation of blob instance', async () => {
        const { Blob } = firebase.firestore;
        const myBlob = Blob.fromBase64String(testBase64);
        myBlob.should.be.instanceOf(Blob);
        should.equal(
          myBlob.toString().includes(testBase64),
          true,
          'toString() should return a string that includes the base64'
        );
      });

      it('.isEqual() -> returns true or false', async () => {
        const { Blob } = firebase.firestore;
        const myBlob = Blob.fromBase64String(testBase64);
        const myBlob2 = Blob.fromBase64String(testBase64Large);
        myBlob.isEqual(myBlob).should.equal(true);
        myBlob2.isEqual(myBlob).should.equal(false);
      });

      it('.isEqual() -> throws if arg not instanceof Blob', async () => {
        const { Blob } = firebase.firestore;
        const myBlob = Blob.fromBase64String(testBase64);
        const myBlob2 = Blob.fromBase64String(testBase64Large);
        myBlob.isEqual(myBlob).should.equal(true);
        (() => myBlob2.isEqual('derp')).should.throwError();
      });

      it('.toBase64() -> returns base64 string', async () => {
        const { Blob } = firebase.firestore;
        const myBlob = Blob.fromBase64String(testBase64);
        myBlob.should.be.instanceOf(Blob);
        myBlob.toBase64().should.equal(testBase64);
      });

      it('.toUint8Array() -> returns Uint8Array', async () => {
        const { Blob } = firebase.firestore;
        const myBlob = Blob.fromBase64String(testBase64);
        const testUInt8Array = new Uint8Array(testBuffer);
        const testUInt8Array2 = new Uint8Array();

        myBlob.should.be.instanceOf(Blob);
        should.deepEqual(myBlob.toUint8Array(), testUInt8Array);
        should.notDeepEqual(myBlob.toUint8Array(), testUInt8Array2);
      });
    });
  });

  /** ----------------
   *    USAGE TESTS
   * -----------------*/
  describe('firestore', () => {
    describe('Blob', () => {
      it('reads and writes small blobs', async () => {
        const { Blob } = firebase.firestore;

        await firebase
          .firestore()
          .doc('blob-tests/small')
          .set({ blobby: Blob.fromBase64String(testBase64) });

        const snapshot = await firebase
          .firestore()
          .doc('blob-tests/small')
          .get();

        const blob = snapshot.data().blobby;
        blob._binaryString.should.equal(testString);
        blob.toBase64().should.equal(testBase64);
      });

      it('reads and writes large blobs', async () => {
        const { Blob } = firebase.firestore;

        await firebase
          .firestore()
          .doc('blob-tests/large')
          .set({ blobby: Blob.fromBase64String(testBase64Large) });

        const snapshot = await firebase
          .firestore()
          .doc('blob-tests/large')
          .get();

        const blob = snapshot.data().blobby;
        blob._binaryString.should.equal(testStringLarge);
        blob.toBase64().should.equal(testBase64Large);
      });
    });
  });
}
