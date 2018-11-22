import { Path } from 'expo-firebase-firestore';

export default function test({
  describe,
  should,
  xdescribe,
  it,
  xit,
  beforeEach,
  expect,
  jasmine,
  firebase,
}) {
  describe('firestore()', () => {
    describe('Path', () => {
      describe('id', () => {
        it('returns the document id', async () => {
          const path = Path.fromName('collection/documentId');
          path.id.should.be.equal('documentId');
        });

        it('returns null if no path', async () => {
          const path = Path.fromName('');
          should.equal(path.id, null);
        });
      });

      describe('isDocument', () => {
        it('returns true if path is a document', async () => {
          const path = Path.fromName('collection/documentId');
          path.isDocument.should.be.equal(true);
        });

        it('returns false if path is a collection', async () => {
          const path = Path.fromName('collection');
          path.isDocument.should.be.equal(false);
        });
      });

      describe('isCollection', () => {
        it('returns true if path is a collection', async () => {
          const path = Path.fromName('collection');
          path.isCollection.should.be.equal(true);
        });

        it('returns false if path is a document', async () => {
          const path = Path.fromName('collection/documentId');
          path.isCollection.should.be.equal(false);
        });
      });

      describe('relativeName', () => {
        it('returns original full path', async () => {
          const path = Path.fromName('collection');
          const path2 = Path.fromName('collection/documentId');
          path.relativeName.should.be.equal('collection');
          path2.relativeName.should.be.equal('collection/documentId');
        });
      });

      describe('child()', () => {
        it('returns original path joined with the provided child path', async () => {
          const path = Path.fromName('collection');
          const path2 = path.child('documentId');
          path.relativeName.should.be.equal('collection');
          path2.relativeName.should.be.equal('collection/documentId');
        });
      });

      describe('parent()', () => {
        it('returns the parent of the current child path', async () => {
          const path = Path.fromName('collection/documentId');
          const path2 = path.parent();
          path.relativeName.should.be.equal('collection/documentId');
          path2.relativeName.should.be.equal('collection');
        });

        it('returns null if no path', async () => {
          const path = Path.fromName('');
          const path2 = path.parent();
          path._parts.length.should.be.equal(0);
          should.equal(path2, null);
        });
      });

      describe('static fromName()', () => {
        it('returns a new instance from a / delimited path string', async () => {
          const path = Path.fromName('collection/document');
          path.should.be.instanceOf(Path);
          path._parts.length.should.be.equal(2);
        });

        it('returns a new instance from an empty string', async () => {
          const path = Path.fromName('');
          path.should.be.instanceOf(Path);
          path._parts.length.should.be.equal(0);
        });
      });

      it('returns a new instance with no args provided', async () => {
        const path = Path.fromName();
        path.should.be.instanceOf(Path);
        path._parts.length.should.be.equal(0);
      });
    });
  });
}
