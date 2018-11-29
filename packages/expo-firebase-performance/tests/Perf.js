import { HttpMetric, Trace } from '../src';
export default function test({
  describe,
  xdescribe,
  it,
  xit,
  beforeEach,
  expect,
  jasmine,
  firebase,
  helpers: { sleep },
  device,
  should,
}) {
  describe('perf()', () => {
    describe('setPerformanceCollectionEnabled()', () => {
      it('true', async () => {
        await firebase.perf().setPerformanceCollectionEnabled(true);
        await sleep(800);
      });

      it('false', async () => {
        await firebase.perf().setPerformanceCollectionEnabled(false);
        await sleep(800);
        await firebase.perf().setPerformanceCollectionEnabled(true);
        await sleep(800);
        await device.launchApp({ newInstance: true });
      });

      it('errors if not boolean', async () => {
        try {
          firebase.perf().setPerformanceCollectionEnabled();
        } catch ({ message }) {
          expect(message).toBe(
            'firebase.perf().setPerformanceCollectionEnabled() requires a boolean value'
          );
        }
      });
    });

    describe('newTrace()', () => {
      it('returns an instance of Trace', async () => {
        const trace = firebase.perf().newTrace('foo');
        expect(trace instanceof Trace).toBeTruthy();
      });

      it('errors if identifier not a string', async () => {
        try {
          firebase.perf().newTrace([1, 2, 3, 4]);
        } catch ({ message }) {
          expect(message).toBe('firebase.perf().newTrace() requires a string value');
        }
      });
    });

    describe('newHttpMetric()', () => {
      it('returns an instance of HttpMetric', async () => {
        const trace = firebase.perf().newHttpMetric('http://foo.com', 'GET');
        expect(trace instanceof HttpMetric).toBeTruthy();
      });

      it('errors if url/httpMethod not a string', async () => {
        try {
          firebase.perf().newHttpMetric(123, [1, 2]);
        } catch ({ message }) {
          expect(message).toBe('firebase.perf().newHttpMetric() requires url to be a string value');
        }
      });

      it('errors if httpMethod not a valid type', async () => {
        try {
          firebase.perf().newHttpMetric('foo', 'FOO');
        } catch (error) {
          expect(error).toBeDefined();
        }
      });
    });
  });
}
