export default function test({
  describe,
  xdescribe,
  it,
  xit,
  beforeEach,
  expect,
  jasmine,
  firebase,
  TestHelpers: {
    database: { CONTENTS, setDatabaseContents },
  },
}) {
  // TODO use testRunId in refs to prevent multiple test instances interfering with each other
  describe('database()', () => {
    describe('Snapshot', () => {
      beforeEach(() => setDatabaseContents());

      it('should provide a functioning val() method', async () => {
        const snapshot = await firebase
          .database()
          .ref('tests/types/array')
          .once('value');

        snapshot.val.should.be.a.Function();
        snapshot.val().should.eql([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      });

      it('should provide a functioning child() method', async () => {
        const snapshot = await firebase
          .database()
          .ref('tests/types/array')
          .once('value');

        snapshot.child('0').val.should.be.a.Function();
        snapshot
          .child('0')
          .val()
          .should.equal(0);
        snapshot.child('0').key.should.be.a.String();
        snapshot.child('0').key.should.equal('0');
      });

      // TODO refactor
      it('should provide a functioning hasChild() method', async () => {
        const snapshot = await firebase
          .database()
          .ref('tests/types/object')
          .once('value');

        snapshot.hasChild.should.be.a.Function();
        snapshot.hasChild('foo').should.equal(true);
        snapshot.hasChild('baz').should.equal(false);
      });

      it('should provide a functioning hasChildren() method', async () => {
        const snapshot = await firebase
          .database()
          .ref('tests/types/object')
          .once('value');

        snapshot.hasChildren.should.be.a.Function();
        snapshot.hasChildren().should.equal(true);
        snapshot
          .child('foo')
          .hasChildren()
          .should.equal(false);
      });

      it('should provide a functioning exists() method', async () => {
        const snapshot = await firebase
          .database()
          .ref('tests/types/object/baz/daz')
          .once('value');

        snapshot.exists.should.be.a.Function();
        snapshot.exists().should.equal(false);
      });

      it('should provide a functioning getPriority() method', async () => {
        const ref = firebase.database().ref('tests/priority');
        const snapshot = await ref.once('value');
        snapshot.getPriority.should.be.a.Function();
        snapshot.getPriority().should.equal(666);
        snapshot.val().should.eql(Object({ foo: 'bar' }));
      });

      it('should provide a functioning forEach() method', async () => {
        const snapshot = await firebase
          .database()
          .ref('tests/types/array')
          .once('value');

        let total = 0;
        snapshot.forEach.should.be.a.Function();
        snapshot.forEach(childSnapshot => {
          const val = childSnapshot.val();
          total += val;
          return val === 3; // stop iteration after key 3
        });

        total.should.equal(6); // 0 + 1 + 2 + 3 = 6
      });

      it('should provide a key property', async () => {
        const snapshot = await firebase
          .database()
          .ref('tests/types/array')
          .once('value');

        snapshot.key.should.be.a.String();
        snapshot.key.should.equal('array');
      });
    });
  });
}
