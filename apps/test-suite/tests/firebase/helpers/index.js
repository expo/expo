/* eslint-disable global-require */
global.sinon = require('sinon');
require('should-sinon');
global.should = require('should');

import firebase from '../firebase';

Object.defineProperty(global, 'firebase', {
  get() {
    return firebase;
  },
});

global.contextify = src => {
  if (isObject(src)) return Object(src);
  if (Array.isArray(src)) return src;
  return src;
};

global.isObject = function isObject(item) {
  return item ? typeof item === 'object' && !Array.isArray(item) && item !== null : false;
};

global.sleep = duration => new Promise(resolve => setTimeout(resolve, duration));

global.randomString = (length, chars) => {
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
};
global.testRunId = randomString(4, 'aA#');

/** ------------------
 *    Init WEB SDK
 ---------------------*/

/** ------------------
 *   Init ADMIN SDK
 ---------------------*/
// global.firebaseAdmin = require('firebase-admin');

// firebaseAdmin.initializeApp({
//   credential: firebaseAdmin.credential.cert(require('./service-account')),
//   databaseURL: 'https://rnfirebase-b9ad4.firebaseio.com',
// });

const originalLog = console.log;
console.log = (...args) => {
  if (
    args &&
    args[0] &&
    typeof args[0] === 'string' &&
    (args[0].toLowerCase().includes('deprecated') ||
      args[0].toLowerCase().includes('restrictions in the native sdk'))
  ) {
    return undefined;
  }

  return originalLog(...args);
};

/**
 * Old style deferred promise shim - for niceness
 *
 * @returns {{resolve: null, reject: null}}
 */
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

global.TestHelpers = {
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
