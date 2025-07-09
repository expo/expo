"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderQueryProviders = renderQueryProviders;
exports.renderQueryPackages = renderQueryPackages;
exports.renderQueryIntents = renderQueryIntents;
function renderQueryProviders(data) {
    return (Array.isArray(data) ? data : [data]).filter(Boolean).map((datum) => ({
        $: {
            'android:authorities': datum,
        },
    }));
}
function renderQueryPackages(data) {
    return (Array.isArray(data) ? data : [data]).filter(Boolean).map((datum) => ({
        $: {
            'android:name': datum,
        },
    }));
}
function renderQueryIntents(queryIntents) {
    return (queryIntents?.map((intent) => {
        const { data, category, action } = intent;
        return {
            action: [
                {
                    $: {
                        'android:name': `android.intent.action.${action}`,
                    },
                },
            ],
            data: (Array.isArray(data) ? data : [data]).filter(Boolean).map((datum) => ({
                $: Object.entries(datum ?? {}).reduce((prev, [key, value]) => ({ ...prev, [`android:${key}`]: value }), {}),
            })),
            category: (Array.isArray(category) ? category : [category]).filter(Boolean).map((cat) => ({
                $: {
                    'android:name': `android.intent.category.${cat}`,
                },
            })),
        };
    }) ?? []);
}
