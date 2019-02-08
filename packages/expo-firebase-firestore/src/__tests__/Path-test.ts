import { Path } from 'expo-firebase-firestore';
import firebase from 'expo-firebase-app';

describe('firestore()', () => {
  describe('Path', () => {
    describe('id', () => {
      it('returns the document id', async () => {
        const path = Path.fromName('collection/documentId');
        expect(path.id).toBe('documentId');
      });

      it('returns null if no path', async () => {
        const path = Path.fromName('');
        expect(path.id).toBe(null);
      });
    });

    describe('isDocument', () => {
      it('returns true if path is a document', async () => {
        const path = Path.fromName('collection/documentId');
        expect(path.isDocument).toBe(true);
      });

      it('returns false if path is a collection', async () => {
        const path = Path.fromName('collection');
        expect(path.isDocument).toBe(false);
      });
    });

    describe('isCollection', () => {
      it('returns true if path is a collection', async () => {
        const path = Path.fromName('collection');
        expect(path.isCollection).toBe(true);
      });

      it('returns false if path is a document', async () => {
        const path = Path.fromName('collection/documentId');
        expect(path.isCollection).toBe(false);
      });
    });

    describe('relativeName', () => {
      it('returns original full path', async () => {
        const path = Path.fromName('collection');
        const path2 = Path.fromName('collection/documentId');
        expect(path.relativeName).toBe('collection');
        expect(path2.relativeName).toBe('collection/documentId');
      });
    });

    describe('child()', () => {
      it('returns original path joined with the provided child path', async () => {
        const path = Path.fromName('collection');
        const path2 = path.child('documentId');
        expect(path.relativeName).toBe('collection');
        expect(path2.relativeName).toBe('collection/documentId');
      });
    });

    describe('parent()', () => {
      it('returns the parent of the current child path', async () => {
        const path = Path.fromName('collection/documentId');
        const path2 = path.parent();
        expect(path.relativeName).toBe('collection/documentId');
        expect(path2.relativeName).toBe('collection');
      });

      it('returns null if no path', async () => {
        const path = Path.fromName('');
        const path2 = path.parent();
        expect(path._parts.length).toBe(0);
        expect(path2).toBe(null);
      });
    });

    describe('static fromName()', () => {
      it('returns a new instance from a / delimited path string', async () => {
        const path = Path.fromName('collection/document');
        expect(path instanceof Path).toBeTruthy();
        expect(path._parts.length).toBe(2);
      });

      it('returns a new instance from an empty string', async () => {
        const path = Path.fromName('');
        expect(path instanceof Path).toBeTruthy();
        expect(path._parts.length).toBe(0);
      });
    });

    it('returns a new instance with no args provided', async () => {
      const path = Path.fromName();
      expect(path instanceof Path).toBeTruthy();
      expect(path._parts.length).toBe(0);
    });
  });
});
