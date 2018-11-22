export default function test({
  describe,
  xdescribe,
  it,
  xit,
  beforeEach,
  expect,
  jasmine,
  firebase,
  should,
}) {
  describe('perf()', () => {
    describe('Trace', () => {
      it('start() & stop()', async () => {
        const trace = firebase.perf().newTrace('bar');
        await trace.start();
        await trace.stop();
      });

      it('getAttribute() should return null', async () => {
        const trace = firebase.perf().newTrace('bar');
        await trace.start();
        const value = await trace.getAttribute('foo');
        should.equal(value, null);
        await trace.stop();
      });

      it('getAttribute() should return string value', async () => {
        const trace = firebase.perf().newTrace('bar');
        await trace.start();
        await trace.putAttribute('foo', 'bar');
        const value = await trace.getAttribute('foo');
        should.equal(value, 'bar');
        await trace.stop();
      });

      it('putAttribute()', async () => {
        const trace = firebase.perf().newTrace('bar');
        await trace.start();
        await trace.putAttribute('foo', 'bar');
        const value = await trace.getAttribute('foo');
        value.should.equal('bar');
        await trace.stop();
      });

      it('getAttributes()', async () => {
        const trace = firebase.perf().newTrace('bar');
        await trace.start();
        await trace.putAttribute('foo', 'bar');
        await trace.putAttribute('bar', 'baz');
        const value = await trace.getAttributes();
        value.should.deepEqual({
          foo: 'bar',
          bar: 'baz',
        });
        await trace.stop();
      });

      it('removeAttribute()', async () => {
        const trace = firebase.perf().newTrace('bar');
        await trace.start();
        await trace.putAttribute('foobar', 'bar');
        const value = await trace.getAttribute('foobar');
        value.should.equal('bar');
        await trace.removeAttribute('foobar');
        const removed = await trace.getAttribute('foobar');
        should.equal(removed, null);
        await trace.stop();
      });

      it('getMetric()', async () => {
        const trace = firebase.perf().newTrace('bar');
        await trace.start();
        const metric = await trace.getMetric('foo');
        metric.should.equal(0);
        await trace.stop();
      });

      it('putMetric()', async () => {
        const trace = firebase.perf().newTrace('bar');
        await trace.start();
        await trace.putMetric('baz', 1);
        const metric = await trace.getMetric('baz');
        metric.should.equal(1);
        await trace.stop();
      });

      it('incrementMetric()', async () => {
        const trace = firebase.perf().newTrace('bar');
        await trace.start();
        await trace.putMetric('baz', 1);
        await trace.incrementMetric('baz', 2);
        const metric = await trace.getMetric('baz');
        metric.should.equal(3);
        await trace.stop();
      });
    });
  });
}
