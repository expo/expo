import { PluginConfigTypeAndroidQueriesIntent } from './pluginConfig';
export declare function renderQueryProviders(data?: string | string[]): {
    $: {
        'android:authorities': string;
    };
}[];
export declare function renderQueryPackages(data?: string | string[]): {
    $: {
        'android:name': string;
    };
}[];
export declare function renderQueryIntents(queryIntents?: PluginConfigTypeAndroidQueriesIntent[]): {
    action: {
        $: {
            'android:name': string;
        };
    }[];
    data: {
        $: {};
    }[];
    category: {
        $: {
            'android:name': string;
        };
    }[];
}[];
