"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadBundleAsync = void 0;
/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const buildUrlForBundle_1 = require("./buildUrlForBundle");
const fetchThenEval_1 = require("./fetchThenEval");
let pendingRequests = 0;
/**
 * Load a bundle for a URL using fetch + eval on native and script tag injection on web.
 *
 * @param bundlePath Given a statement like `import('./Bacon')` `bundlePath` would be `Bacon.bundle?params=from-metro`.
 */
async function loadBundleAsync(bundlePath) {
    const requestUrl = (0, buildUrlForBundle_1.buildUrlForBundle)(bundlePath);
    if (process.env.NODE_ENV === 'production') {
        return (0, fetchThenEval_1.fetchThenEvalAsync)(requestUrl);
    }
    else {
        const Platform = require('react-native').Platform;
        const LoadingView = require('../LoadingView')
            .default;
        if (Platform.OS !== 'web') {
            // Send a signal to the `expo` package to show the loading indicator.
            LoadingView.showMessage('Downloading...', 'load');
        }
        pendingRequests++;
        return (0, fetchThenEval_1.fetchThenEvalAsync)(requestUrl)
            .then(() => {
            const HMRClient = require('../HMRClient').default;
            HMRClient.registerBundle(requestUrl);
        })
            .finally(() => {
            if (!--pendingRequests && Platform.OS !== 'web') {
                LoadingView.hide();
            }
        });
    }
}
exports.loadBundleAsync = loadBundleAsync;
//# sourceMappingURL=loadBundle.js.map