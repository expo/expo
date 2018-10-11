import './helpers';

import { Platform } from 'react-native';

import analytics from './analytics/analytics.e2e';
import auth from './auth/auth.e2e';
import authEmailLink from './auth/emailLink.e2e';
import authPhone from './auth/phone.e2e';
import authProvider from './auth/provider.e2e';
import authUser from './auth/user.e2e';
import config from './config/config.e2e';
import core from './core/core.e2e';
import databaseOnce from './database/ref/once.e2e.js';
import databaseSet from './database/ref/set.e2e.js';
import databaseSnapshot from './database/snapshot.e2e.js';
import databaseTransactions from './database/transactions.e2e.js';
import firebase from './firebase';
import firestoreBatch from './firestore/batch.e2e.js';
import firestoreDocumentReference from './firestore/documentReference.e2e.js';
import firestoreDocumentSnapshot from './firestore/documentSnapshot.e2e.js';
import firestoreFieldPath from './firestore/fieldPath.e2e.js';
import firestoreFieldValue from './firestore/fieldValue.e2e.js';
import firestore from './firestore/firestore.e2e.js';
import firestorePath from './firestore/path.e2e.js';
import firestoreTransactions from './firestore/transactions.e2e.js';
import functions from './functions/functions.e2e';
import iid from './iid/iid.e2e';
import httpMetric from './perf/httpMetric.e2e';
import perf from './perf/perf.e2e';
import trace from './perf/trace.e2e';
import storage from './storage/storage.e2e';

require('sinon');
require('should-sinon');
require('should');

const { OS } = Platform;

// Need Buffer
// import firestoreBlob from './firestore/blob.e2e.js';
// TODO: Blob needs Buffer
const tests = [
  // analytics,
  // iid,
  // perf,
  // trace,
  // httpMetric,
  // config,
  // core,
  functions,
  // storage,
  // auth,
  // authEmailLink,
  // authPhone,
  // authProvider,
  // authUser,
  // databaseOnce,
  // databaseSet,
  // databaseSnapshot,
  // databaseTransactions,
  // firestoreDocumentReference,
  // firestoreDocumentSnapshot,
  // firestoreFieldPath,
  // firestoreFieldValue,
  // firestore,
  // firestorePath,
  // firestoreTransactions,
  // firestoreBatch,
].map(test => ({
  test: props => {
    var originalTimeout;
    props.beforeEach(function() {
      originalTimeout = props.jasmine.DEFAULT_TIMEOUT_INTERVAL;
      props.jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    });

    let testFcn = test({ ...props, firebase, OS });

    props.afterEach(function() {
      props.jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });

    return testFcn;
  },
}));

export default tests;
