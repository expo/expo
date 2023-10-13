"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderQueryIntents = exports.renderQueryPackages = exports.renderQueryProviders = void 0;
function renderQueryProviders(data) {
    const dataStr = Array.isArray(data) ? data.join(';') : data;
    return dataStr ? { $: { 'android:authorities': dataStr } } : undefined;
}
exports.renderQueryProviders = renderQueryProviders;
function renderQueryPackages(data) {
    return (Array.isArray(data) ? data : [data]).filter(Boolean).map((datum) => ({
        $: {
            'android:name': datum,
        },
    }));
}
exports.renderQueryPackages = renderQueryPackages;
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
exports.renderQueryIntents = renderQueryIntents;
