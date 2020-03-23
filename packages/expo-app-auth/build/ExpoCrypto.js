/*
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { AppAuthError } from '@openid/appauth';
import * as ExpoNativeCrypto from 'expo-crypto';
import * as ExpoRandom from 'expo-random';
import { Platform } from 'react-native';
const HAS_CRYPTO = Platform.OS === 'web' && !!window?.crypto;
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
// From react-native-base64
export function encodeBase64NoWrap(input) {
    let output = '';
    let chr1;
    let chr2;
    let chr3;
    let enc1;
    let enc2;
    let enc3;
    let enc4;
    let i = 0;
    do {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);
        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;
        if (isNaN(chr2)) {
            enc3 = 64;
            enc4 = 64;
        }
        else if (isNaN(chr3)) {
            enc4 = 64;
        }
        output =
            output +
                keyStr.charAt(enc1) +
                keyStr.charAt(enc2) +
                keyStr.charAt(enc3) +
                keyStr.charAt(enc4);
        chr1 = undefined;
        chr2 = undefined;
        chr3 = undefined;
        enc1 = undefined;
        enc2 = undefined;
        enc3 = undefined;
        enc4 = undefined;
    } while (i < input.length);
    return output;
}
export function bufferToString(buffer, charset = CHARSET) {
    let state = [];
    for (let i = 0; i < buffer.byteLength; i += 1) {
        let index = buffer[i] % charset.length;
        state.push(charset[index]);
    }
    return state.join('');
}
export function urlSafe(b64) {
    return b64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
// adapted from source: http://stackoverflow.com/a/11058858
// this is used in place of TextEncode as the api is not yet
// well supported: https://caniuse.com/#search=TextEncoder
export function textEncodeLite(str) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0; i < str.length; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return bufView;
}
async function getRandomValuesAsync(arr) {
    let orig = arr;
    if (arr.byteLength !== arr.length) {
        // Get access to the underlying raw bytes
        arr = new Uint8Array(arr.buffer);
    }
    const bytes = await ExpoRandom.getRandomBytesAsync(arr.length);
    for (var i = 0; i < bytes.length; i++) {
        arr[i] = bytes[i];
    }
    return orig;
}
/**
 * Extension of the default implementation of the `Crypto` interface.
 * This uses the capabilities of the native platform via Expo Unimodules.
 */
export class ExpoCrypto {
    // TODO(Bacon): Change this to be sync in the future when Expo unimodules support sync methods
    // @ts-ignore: we need to use async unfortunately
    async generateRandom(size) {
        let buffer = new Uint8Array(size);
        if (HAS_CRYPTO) {
            // TODO(Bacon): Make random be sync
            await getRandomValuesAsync(buffer);
        }
        else {
            // fall back to Math.random() if nothing else is available
            for (let i = 0; i < size; i += 1) {
                buffer[i] = (Math.random() * CHARSET.length) | 0;
            }
        }
        return bufferToString(buffer);
    }
    /**
     * Compute the SHA256 of a given code.
     * This is useful when using PKCE.
     * Proof key for Code Exchange by OAuth Public Clients (RFC 7636), Section 4.1
     * https://tools.ietf.org/html/rfc7636#section-4.1
     */
    async deriveChallenge(code) {
        // 43 is the minimum, and 128 is the maximum.
        if (code.length < 43 || code.length > 128) {
            throw new AppAuthError('Invalid code length.');
        }
        const buffer = await ExpoNativeCrypto.digestStringAsync(ExpoNativeCrypto.CryptoDigestAlgorithm.SHA256, code, { encoding: ExpoNativeCrypto.CryptoEncoding.BASE64 });
        return urlSafe(buffer);
    }
}
//# sourceMappingURL=ExpoCrypto.js.map