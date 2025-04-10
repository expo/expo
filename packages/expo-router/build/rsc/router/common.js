"use strict";
/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOCATION_ID = exports.SHOULD_SKIP_ID = exports.PARAM_KEY_SKIP = void 0;
exports.getComponentIds = getComponentIds;
exports.getInputString = getInputString;
exports.parseInputString = parseInputString;
function getComponentIds(path) {
    const pathItems = path.split('/').filter(Boolean);
    const idSet = new Set();
    for (let index = 0; index <= pathItems.length; ++index) {
        const id = [...pathItems.slice(0, index), 'layout'].join('/');
        idSet.add(id);
    }
    idSet.add([...pathItems, 'page'].join('/'));
    return Array.from(idSet);
}
function getInputString(path) {
    if (!path.startsWith('/')) {
        throw new Error('Path should start with `/`');
    }
    return path.slice(1);
}
function parseInputString(input) {
    return '/' + input;
}
exports.PARAM_KEY_SKIP = 'expo_router_skip';
// It starts with "/" to avoid conflicing with normal component ids.
exports.SHOULD_SKIP_ID = '/SHOULD_SKIP';
// It starts with "/" to avoid conflicting with normal component ids.
exports.LOCATION_ID = '/LOCATION';
//# sourceMappingURL=common.js.map