import { Platform } from '@unimodules/core';
function isString(str) {
    return typeof str === 'string';
}
function isValidString(str) {
    return isString(str) && str !== '';
}
export function isObject(item) {
    return item ? typeof item === 'object' && !Array.isArray(item) && item !== null : false;
}
export function guessProjectId({ storageBucket, authDomain, databaseURL, }) {
    function extractFromUrl(url) {
        if (!isValidString(url))
            return;
        const first = url.split('.')[0];
        if (!isValidString(first))
            return;
        return first.replace(/(^\w+:|^)\/\//, '');
    }
    const projectId = extractFromUrl(databaseURL) || extractFromUrl(storageBucket) || extractFromUrl(authDomain);
    return projectId;
}
export function parseCommonConfig(data) {
    if (!isValidString(data.projectId)) {
        data.projectId = guessProjectId(data);
        if (isValidString(data.projectId)) {
            return parseCommonConfig(data);
        }
    }
    else {
        if (!isValidString(data.databaseURL)) {
            data.databaseURL = `https://${data.projectId}.firebaseio.com`;
        }
        if (!isValidString(data.storageBucket)) {
            data.storageBucket = `${data.projectId}.appspot.com`;
        }
        if (!isValidString(data.authDomain)) {
            data.authDomain = `${data.projectId}.firebaseapp.com`;
        }
    }
    return data;
}
export function parseAndroidConfig(data) {
    const { project_info, client } = data;
    if (isObject(project_info)) {
        if (!data.messagingSenderId && project_info.project_number) {
            data.messagingSenderId = project_info.project_number;
        }
        if (!data.databaseURL && project_info.firebase_url) {
            data.databaseURL = project_info.firebase_url;
        }
        if (!data.projectId && project_info.project_id) {
            data.projectId = project_info.project_id;
        }
        if (!data.storageBucket && project_info.storage_bucket) {
            data.storageBucket = project_info.storage_bucket;
        }
    }
    function destructureArray(obj) {
        if (obj && Array.isArray(obj) && obj.length && isObject(obj[0]))
            return obj[0];
    }
    const firstClient = destructureArray(client);
    if (firstClient) {
        const { client_info } = firstClient;
        if (isObject(client_info) && !data.appId && client_info.mobilesdk_app_id) {
            data.appId = client_info.mobilesdk_app_id;
        }
        const firstOAuthClient = destructureArray(firstClient.oauth_client);
        if (!data.clientId && firstOAuthClient && firstOAuthClient.client_id) {
            data.clientId = firstOAuthClient.client_id;
        }
        const firstAPIKey = destructureArray(firstClient.api_key);
        if (!data.apiKey && firstAPIKey && firstAPIKey.current_key) {
            data.apiKey = firstAPIKey.current_key;
        }
    }
    return data;
}
export function parseIosConfig(plist) {
    const desiredKeys = {
        appId: 'GOOGLE_APP_ID',
        apiKey: 'API_KEY',
        databaseURL: 'DATABASE_URL',
        messagingSenderId: 'GCM_SENDER_ID',
        projectId: 'PROJECT_ID',
        storageBucket: 'STORAGE_BUCKET',
        authDomain: 'AUTH_DOMAIN',
        clientId: 'CLIENT_ID',
        deepLinkURLScheme: 'DEEP_LINK_URL_SCHEME',
        reversedClientId: 'REVERSED_CLIENT_ID',
        adUnitIdForInterstitialTest: 'AD_UNIT_ID_FOR_INTERSTITIAL_TEST',
        adUnitIdForBannerTest: 'AD_UNIT_ID_FOR_BANNER_TEST',
    };
    Object.entries(desiredKeys).forEach(entry => {
        const [key, value] = entry;
        if (plist[key] === undefined && plist[value]) {
            plist[key] = plist[value];
        }
    });
    return plist;
}
export default function parseConfig(config) {
    if (Platform.OS === 'android') {
        config = parseAndroidConfig(config);
    }
    else if (Platform.OS === 'ios') {
        config = parseIosConfig(config);
    }
    config = parseCommonConfig(config);
    return config;
}
//# sourceMappingURL=parseConfig.js.map