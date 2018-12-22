'use strict';
import Immutable from 'immutable';
import jasmineModule from 'jasmine-core/lib/jasmine-core/jasmine';
import { NativeModules } from 'react-native';

const { ExponentTest } = NativeModules;

let _results = '';
let _failures = '';

// A jasmine reporter that writes results to this.state
function jasmineSetStateReporter(jasmineEnv, app) {
  return {
    suiteStarted(jasmineResult) {
      app.setState(({ state }) => ({
        state: state
          .updateIn(state.get('path'), children =>
            children.push(
              Immutable.fromJS({
                result: jasmineResult,
                children: [],
                specs: [],
              })
            )
          )
          .update('path', path => path.push(state.getIn(path).size, 'children')),
      }));
    },

    suiteDone(jasmineResult) {
      app.setState(({ state }) => ({
        state: state
          .updateIn(
            state
              .get('path')
              .pop()
              .pop(),
            children =>
              children.update(children.size - 1, child => child.set('result', child.get('result')))
          )
          .update('path', path => path.pop().pop()),
      }));
    },

    specStarted(jasmineResult) {
      app.setState(({ state }) => ({
        state: state.updateIn(
          state
            .get('path')
            .pop()
            .pop(),
          children =>
            children.update(children.size - 1, child =>
              child.update('specs', specs => specs.push(Immutable.fromJS(jasmineResult)))
            )
        ),
      }));
    },

    specDone(jasmineResult) {
      if (app.state.testPortal) {
        console.warn(
          `The test portal has not been cleaned up by \`${
            jasmineResult.fullName
          }\`. Call \`cleanupPortal\` before finishing the test.`
        );
      }

      app.setState(({ state }) => ({
        state: state.updateIn(
          state
            .get('path')
            .pop()
            .pop(),
          children =>
            children.update(children.size - 1, child =>
              child.update('specs', specs =>
                specs.set(specs.size - 1, Immutable.fromJS(jasmineResult))
              )
            )
        ),
      }));
    },
  };
}

// A jasmine reporter that writes results to the console
function jasmineConsoleReporter(jasmineEnv) {
  const failedSpecs = [];

  return {
    specDone(result) {
      if (result.status === 'passed' || result.status === 'failed') {
        // Open log group if failed
        const grouping = result.status === 'passed' ? '---' : '+++';
        if (ExponentTest && ExponentTest.log) {
          ExponentTest.log(`${result.status === 'passed' ? 'PASS' : 'FAIL'} ${result.fullName}`);
        }
        const emoji = result.status === 'passed' ? ':green_heart:' : ':broken_heart:';
        console.log(`${grouping} ${emoji} ${result.fullName}`);
        _results += `${grouping} ${result.fullName}\n`;

        if (result.status === 'failed') {
          _failures += `${grouping} ${result.fullName}\n`;
          result.failedExpectations.forEach(({ matcherName, message }) => {
            if (ExponentTest && ExponentTest.log) {
              ExponentTest.log(`${matcherName}: ${message}`);
            }
            console.log(`${matcherName}: ${message}`);
            _results += `${matcherName}: ${message}\n`;
            _failures += `${matcherName}: ${message}\n`;
          });
          failedSpecs.push(result);
        }
      }
    },

    suiteDone(result) {},

    jasmineStarted() {
      console.log('--- tests started');
    },

    jasmineDone() {
      console.log('--- tests done');
      console.log('--- send results to runner');
      let result = JSON.stringify({
        magic: '[TEST-SUITE-END]', // NOTE: Runner/Run.js waits to see this
        failed: failedSpecs.length,
        results: _results,
      });
      console.log(result);

      if (ExponentTest) {
        // Native logs are truncated so log just the failures for now
        ExponentTest.completed(
          JSON.stringify({
            failed: failedSpecs.length,
            failures: _failures,
          })
        );
      }
    },
  };
}

export default async function setupJasmine(app) {
  // Init
  jasmineModule.DEFAULT_TIMEOUT_INTERVAL = 10000;
  const jasmineCore = jasmineModule.core(jasmineModule);
  const jasmineEnv = jasmineCore.getEnv();

  // Add our custom reporters too
  jasmineEnv.addReporter(jasmineSetStateReporter(undefined, app));
  jasmineEnv.addReporter(jasmineConsoleReporter());

  // Get the interface and make it support `async ` by default
  const jasmine = jasmineModule.interface(jasmineCore, jasmineEnv);
  const doneIfy = fn => async done => {
    try {
      await fn();
      done();
    } catch (e) {
      done.fail(e);
    }
  };
  const oldIt = jasmine.it;
  jasmine.it = (desc, fn, t) => oldIt.apply(jasmine, [desc, doneIfy(fn), t]);
  const oldXit = jasmine.xit;
  jasmine.xit = (desc, fn, t) => oldXit.apply(jasmine, [desc, doneIfy(fn), t]);
  const oldFit = jasmine.fit;
  jasmine.fit = (desc, fn, t) => oldFit.apply(jasmine, [desc, doneIfy(fn), t]);

  return {
    jasmineEnv,
    jasmine,
  };
}
