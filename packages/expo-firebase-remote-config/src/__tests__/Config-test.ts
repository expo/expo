export default function test({
  describe,
  expect,
  it,
  xit,
  beforeEach: before,
  firebase,
  OS,
  should,
}) {
  describe('config()', () => {
    before(() => {
      firebase.config().enableDeveloperMode();
      firebase.config().setDefaults({
        foo: 'bar',
        bar: 'baz',
      });
    });

    describe('fetch()', () => {
      it('with expiration provided', () => firebase.config().fetch(0));
      it('without expiration provided', () => firebase.config().fetch());
    });

    describe('activateFetched()', () => {
      it('with expiration provided', async () => {
        await firebase.config().fetch(0);
        const activated = await firebase.config().activateFetched();
        activated.should.be.a.Boolean();
      });

      it('with expiration provided', async () => {
        await firebase.config().fetch();
        const activated = await firebase.config().activateFetched();
        activated.should.be.a.Boolean();
      });
    });

    describe('getValue()', () => {
      it('gets a single value by key', async () => {
        const config = await firebase.config().getValue('foo');
        config.should.be.a.Object();
        config.source.should.be.a.String();
        config.val.should.be.a.Function();
        config.val().should.be.equalOneOf('bar', true);
      });

      xit('errors if no key provided or is not a string', async () => {
        // TODO needs input validation adding to lib
      });
    });

    describe('getValues()', () => {
      it('get multiple values by an array of keys', async () => {
        const config = await firebase.config().getValues(['foo', 'bar']);

        expect(typeof config).toBe('object');

        expect('foo' in config).toBeTruthy();
        expect('bar' in config).toBeTruthy();

        const fooValue = config.foo.val();
        const barValue = config.bar.val();

        expect(fooValue).toBe(true);
        expect(barValue).toBe('baz');
      });

      xit('errors if any key is not a string', async () => {
        // TODO needs input validation adding to lib
      });
    });

    describe('getKeysByPrefix()', () => {
      // TODO: Bacon: new keys
      xit('get keys beginning with the prefix provided', async () => {
        const keys = await firebase.config().getKeysByPrefix('num');
        expect(Array.isArray(keys)).toBeTruthy();
        expect(keys.length).toBe(2);
      });

      xit('get all keys as an array if no prefix provided', async () => {
        // TODO flakey on Android
        const keys = await firebase.config().getKeysByPrefix();
        keys.should.be.Array();
        should.equal(keys.length, 4);
      });

      xit('errors if prefix is not a string', async () => {
        // TODO needs input validation adding to lib
      });
    });

    describe('setDefaultsFromResource()', () => {
      it('accepts a resource id/name to read defaults from', async () => {
        if (OS === 'android') firebase.config().setDefaultsFromResource(6666);
        else firebase.config().setDefaultsFromResource();
        // todo add plist/xml on ios/android to test
      });

      xit('errors if id not a integer for android or a string for ios', async () => {
        // TODO needs input validation adding to lib
      });
    });
  });
}
