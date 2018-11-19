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
}) {
  describe('perf()', () => {
    describe('HttpMetric', () => {
      it('start() & stop()', async () => {
        const httpMetric = firebase.perf().newHttpMetric('http://foo.com', 'GET');
        await httpMetric.start();
        await httpMetric.stop();
      });

      it('removeAttribute()', async () => {
        const httpMetric = firebase.perf().newHttpMetric('http://foo.com', 'GET');
        await httpMetric.start();
        await httpMetric.putAttribute('foo', 'bar');
        const value = await httpMetric.getAttribute('foo');
        should.equal(value, 'bar');
        await httpMetric.removeAttribute('foo');
        const value2 = await httpMetric.getAttribute('foo');
        should.equal(value2, null);
        await httpMetric.stop();
      });

      it('getAttribute() should return null', async () => {
        const httpMetric = firebase.perf().newHttpMetric('http://foo.com', 'GET');
        await httpMetric.start();
        const value = await httpMetric.getAttribute('foo');
        should.equal(value, null);
        await httpMetric.removeAttribute('foo');
        await httpMetric.stop();
      });

      it('getAttribute() should return string value', async () => {
        const httpMetric = firebase.perf().newHttpMetric('http://foo.com', 'GET');
        await httpMetric.start();
        await httpMetric.putAttribute('foo', 'bar');
        const value = await httpMetric.getAttribute('foo');
        should.equal(value, 'bar');
        await httpMetric.removeAttribute('foo');
        await httpMetric.stop();
      });

      it('putAttribute()', async () => {
        const httpMetric = firebase.perf().newHttpMetric('http://foo.com', 'GET');
        await httpMetric.start();
        await httpMetric.putAttribute('foo', 'bar');
        const value = await httpMetric.getAttribute('foo');
        value.should.equal('bar');
        await httpMetric.removeAttribute('foo');
        await httpMetric.stop();
      });

      it('getAttributes()', async () => {
        const httpMetric = firebase.perf().newHttpMetric('http://foo.com', 'GET');
        await httpMetric.start();
        await httpMetric.putAttribute('foo', 'bar');
        await httpMetric.putAttribute('bar', 'baz');
        const value = await httpMetric.getAttributes();
        value.should.deepEqual({
          foo: 'bar',
          bar: 'baz',
        });
        await httpMetric.removeAttribute('foo');
        await httpMetric.removeAttribute('bar');
        await httpMetric.stop();
      });

      it('setHttpResponseCode()', async () => {
        const httpMetric = firebase.perf().newHttpMetric('http://foo.com', 'GET');
        await httpMetric.start();
        await httpMetric.setHttpResponseCode(500);
        await httpMetric.stop();
      });

      it('setRequestPayloadSize()', async () => {
        const httpMetric = firebase.perf().newHttpMetric('http://foo.com', 'GET');
        await httpMetric.start();
        await httpMetric.setRequestPayloadSize(1234567);
        await httpMetric.stop();
      });

      it('setResponseContentType()', async () => {
        const httpMetric = firebase.perf().newHttpMetric('http://foo.com', 'GET');
        await httpMetric.start();
        await httpMetric.setResponseContentType('application/foobar');
        await httpMetric.stop();
      });

      it('setResponsePayloadSize()', async () => {
        const httpMetric = firebase.perf().newHttpMetric('http://foo.com', 'GET');
        await httpMetric.start();
        await httpMetric.setResponsePayloadSize(123456789);
        await httpMetric.stop();
      });
    });
  });
}
