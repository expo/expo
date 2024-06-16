import { PluginConfigTypeAndroidQueriesIntent } from './pluginConfig';

export function renderQueryProviders(data?: string | string[]) {
  return (Array.isArray(data) ? data : [data]).filter(Boolean).map((datum) => ({
    $: {
      'android:authorities': datum as string,
    },
  }));
}

export function renderQueryPackages(data?: string | string[]) {
  return (Array.isArray(data) ? data : [data]).filter(Boolean).map((datum) => ({
    $: {
      'android:name': datum as string,
    },
  }));
}

export function renderQueryIntents(queryIntents?: PluginConfigTypeAndroidQueriesIntent[]) {
  return (
    queryIntents?.map((intent) => {
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
          $: Object.entries(datum ?? {}).reduce(
            (prev, [key, value]) => ({ ...prev, [`android:${key}`]: value }),
            {}
          ),
        })),
        category: (Array.isArray(category) ? category : [category]).filter(Boolean).map((cat) => ({
          $: {
            'android:name': `android.intent.category.${cat}`,
          },
        })),
      };
    }) ?? []
  );
}
