import { Platform } from 'react-native';
import firebase from 'expo-firebase-app';
import sinon from 'sinon';
import should from 'should';

import * as Analytics from 'expo-firebase-analytics/tests';
import * as App from 'expo-firebase-app/tests';
import * as Auth from 'expo-firebase-auth/tests';
import * as Crashlytics from 'expo-firebase-crashlytics/tests';
import * as Database from 'expo-firebase-database/tests';
import * as Firestore from 'expo-firebase-firestore/tests';
import * as Functions from 'expo-firebase-functions/tests';
import * as Id from 'expo-firebase-instance-id/tests';
import * as Invites from 'expo-firebase-invites/tests';
import * as Links from 'expo-firebase-links/tests';
import * as Messaging from 'expo-firebase-messaging/tests';
import * as Notifications from 'expo-firebase-notifications/tests';
import * as Performance from 'expo-firebase-performance/tests';
import * as Config from 'expo-firebase-remote-config/tests';
import * as Storage from 'expo-firebase-storage/tests';
require('should-sinon');

const { OS } = Platform;

const helpers = {
  randomString(length, chars) {
    let mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';
    if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
    let result = '';
    for (let i = length; i > 0; --i) {
      result += mask[Math.round(Math.random() * (mask.length - 1))];
    }
    return result;
  },
  sleep(t) {
    return new Promise(res => setTimeout(res, t));
  },
};
const testRunId = helpers.randomString(4, 'aA#');
global.testRunId = testRunId;

Promise.defer = function defer() {
  const deferred = {
    resolve: null,
    reject: null,
  };

  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return deferred;
};

const isObject = function isObject(item) {
  return item ? typeof item === 'object' && !Array.isArray(item) && item !== null : false;
};

const contextify = src => {
  if (isObject(src)) return Object(src);
  if (Array.isArray(src)) return src;
  return src;
};

const device = {
  launchApp({ newInstance }) {
    // TODO: Bacon: detox
    return Promise.resolve();
  },
};

const TestHelpers = {
  functions: {
    data: {
      number: 1234,
      string: 'acde',
      boolean: true,
      null: null,
      simpleObject: {
        number: 1234,
        string: 'acde',
        boolean: true,
        null: null,
      },
      simpleArray: [1234, 'acde', true, null],
      advancedObject: {
        array: [1234, 'acde', false, null],
        object: {
          number: 1234,
          string: 'acde',
          boolean: true,
          null: null,
          array: [1234, 'acde', true, null],
        },
        number: 1234,
        string: 'acde',
        boolean: true,
        null: null,
      },
      advancedArray: [
        1234,
        'acde',
        true,
        null,
        [1234, 'acde', true, null],
        {
          number: 1234,
          string: 'acde',
          boolean: true,
          null: null,
          array: [1234, 'acde', true, null],
        },
      ],
    },
  },
  firestore: require('./firestore'),
  database: require('./database'),
};
function addDeps(test) {
  return {
    test: props => {
      var originalTimeout;
      props.beforeEach(function() {
        originalTimeout = props.jasmine.DEFAULT_TIMEOUT_INTERVAL;
        props.jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
      });

      let testFcn = test({
        ...props,
        firebase,
        OS,
        should,
        sinon,
        helpers,
        device,
        TestHelpers,
        contextify,
        testRunId,
      });

      props.afterEach(function() {
        props.jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
      });

      return testFcn;
    },
  };
}

let modules = [];
[
  Analytics,
  App,
  //   Auth,
  Crashlytics,
  Database,
  Firestore,
  Functions,
  Id,
  Invites,
  Links,
  Messaging,
  Notifications,
  Performance,
  Config,
  Storage,
].forEach(module => {
  modules = [...modules, ...Object.values(module)];
});
const tests = modules.map(addDeps);

export default tests;
