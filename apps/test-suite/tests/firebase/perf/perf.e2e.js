import { Trace, HttpMetric } from 'expo-firebase-performance';

export default function test({
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
    describe('setPerformanceCollectionEnabled()', () => {
      it('true', async () => {
        await firebase.perf().setPerformanceCollectionEnabled(true);
      });

      it('false', async () => {
        await firebase.perf().setPerformanceCollectionEnabled(false);
      });

      it('errors if not boolean', async () => {
        (() => firebase.perf().setPerformanceCollectionEnabled()).should.throw(
          'firebase.perf().setPerformanceCollectionEnabled() requires a boolean value'
        );
      });
    });

    describe('newTrace()', () => {
      it('returns an instance of Trace', async () => {
        const trace = firebase.perf().newTrace('foo');
        expect(trace instanceof Trace).toBe(true);
      });

      it('errors if identifier not a string', async () => {
        (() => firebase.perf().newTrace([1, 2, 3, 4])).should.throw(
          'firebase.perf().newTrace() requires a string value'
        );
      });
    });

    describe('newHttpMetric()', () => {
      it('returns an instance of HttpMetric', async () => {
        const trace = firebase.perf().newHttpMetric('http://foo.com', 'GET');
        expect(trace instanceof HttpMetric).toBe(true);
      });

      it('errors if url/httpMethod not a string', async () => {
        (() => firebase.perf().newHttpMetric(123, [1, 2])).should.throw(
          'firebase.perf().newHttpMetric() requires url and httpMethod string values'
        );
      });

      it('errors if httpMethod not a valid type', async () => {
        (() => firebase.perf().newHttpMetric('foo', 'FOO')).should.throw(); // TODO error
      });
    });
  });
}
