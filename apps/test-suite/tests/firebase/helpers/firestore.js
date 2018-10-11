const TEST_COLLECTION_NAME = 'tests';
const TEST2_COLLECTION_NAME = 'tests2';
// const TEST3_COLLECTION_NAME = 'tests3';

let shouldCleanup = false;
const ONE_HOUR = 60 * 60 * 1000;

module.exports = {
  async cleanup() {
    if (!shouldCleanup) return Promise.resolve();
    await Promise.all([
      module.exports.cleanCollection(TEST_COLLECTION_NAME),
      module.exports.cleanCollection(TEST2_COLLECTION_NAME),
    ]);
    // await module.exports.cleanCollection(`${TEST_COLLECTION_NAME}3`);
    // await module.exports.cleanCollection(`${TEST_COLLECTION_NAME}4`);
    return Promise.resolve();
  },

  TEST_COLLECTION_NAME,
  TEST2_COLLECTION_NAME,
  // TEST3_COLLECTION_NAME,

  DOC_1: { name: 'doc1' },
  DOC_1_PATH: `tests/doc1${testRunId}`,

  DOC_2: { name: 'doc2', title: 'Document 2' },
  DOC_2_PATH: `tests/doc2${testRunId}`,

  // needs to be a fn as firebase may not yet be available
  COL_DOC_1() {
    shouldCleanup = true;
    return {
      baz: true,
      daz: 123,
      foo: 'bar',
      gaz: 12.1234567,
      geopoint: new firebase.firestore.GeoPoint(0, 0),
      naz: null,
      object: {
        daz: 123,
      },
      timestamp: new Date(2017, 2, 10, 10, 0, 0),
    };
  },

  // needs to be a fn as firebase may not yet be available
  COL2_DOC_1() {
    shouldCleanup = true;
    return {
      baz: true,
      daz: 123,
      foo: 'bar',
      gaz: 12.1234567,
      geopoint: new firebase.firestore.GeoPoint(0, 0),
      naz: null,
      object: {
        daz: 123,
      },
      timestamp: new Date(2017, 2, 10, 10, 0, 0),
    };
  },

  COL_DOC_1_ID: `col1${testRunId}`,
  COL_DOC_1_PATH: `${TEST_COLLECTION_NAME}/col1${testRunId}`,

  COL2_DOC_1_ID: `doc1${testRunId}`,
  COL2_DOC_1_PATH: `${TEST2_COLLECTION_NAME}/doc1${testRunId}`,

  /**
   * Removes all documents on the collection for the current testId or
   * documents older than 24 hours
   *
   * @param collectionName
   * @return {Promise<*>}
   */
  async cleanCollection(collectionName) {
    const firestore = firebase.firestore();
    const collection = firestore.collection(collectionName || TEST_COLLECTION_NAME);

    const docsToDelete = (await collection.get()).docs;
    const yesterday = new Date(new Date() - 24 * ONE_HOUR);

    if (docsToDelete.length) {
      const batch = firestore.batch();

      for (let i = 0, len = docsToDelete.length; i < len; i++) {
        const { ref } = docsToDelete[i];

        if (ref.path.includes(testRunId) || new Date(docsToDelete[i].createTime) <= yesterday) {
          batch.delete(ref);
        }
      }

      return batch.commit();
    }

    return Promise.resolve();
  },

  testDocRef(docId) {
    shouldCleanup = true;
    return firebase
      .firestore()
      .collection(TEST_COLLECTION_NAME)
      .doc(
        docId.startsWith(testRunId) || docId.endsWith(testRunId) ? docId : `${testRunId}${docId}`
      );
  },

  test2DocRef(docId) {
    shouldCleanup = true;
    return firebase
      .firestore()
      .collection(TEST2_COLLECTION_NAME)
      .doc(
        docId.startsWith(testRunId) || docId.endsWith(testRunId) ? docId : `${testRunId}${docId}`
      );
  },

  testCollection(collection) {
    shouldCleanup = true;
    return firebase.firestore().collection(collection);
  },

  testCollectionDoc(path) {
    shouldCleanup = true;
    return firebase.firestore().doc(path);
  },

  testCollectionDocAdmin(path) {
    shouldCleanup = true;
    return firebase.firestore().doc(path);
    // return firebaseAdmin.firestore().doc(path);
  },

  async resetTestCollectionDoc(path, doc) {
    shouldCleanup = true;
    const _doc = doc || module.exports.COL_DOC_1();

    await firebase
      .firestore()
      .doc(path || module.exports.COL_DOC_1_PATH)
      .set(_doc);

    return _doc;
  },
};

// call a get request without waiting to force firestore to connect
// so the first test isn't delayed whilst connecting
module.exports
  .testCollectionDocAdmin(module.exports.DOC_1_PATH)
  .get()
  .then(() => {})
  .catch(() => {});
