const CONTENTS = require('./content');
import firebase from '../../firebase';

module.exports = {
  CONTENTS,
  setDatabaseContents() {
    const database = firebase.database();
    return Promise.all([
      database.ref('tests/types').set(CONTENTS.DEFAULT),
      database.ref('tests/priority').setWithPriority(
        {
          foo: 'bar',
        },
        666
      ),
      database.ref('tests/query').set(CONTENTS.QUERY),
    ]);
  },
};
