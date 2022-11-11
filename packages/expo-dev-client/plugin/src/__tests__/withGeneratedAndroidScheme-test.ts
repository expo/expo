import { AndroidConfig, AndroidManifest } from '@expo/config-plugins';

import {
  removeExpoSchemaFromVerifiedIntentFilters,
  setGeneratedAndroidScheme,
} from '../withGeneratedAndroidScheme';

describe(setGeneratedAndroidScheme, () => {
  it(`prevents adding duplicates`, () => {
    let androidManifest: AndroidManifest = {
      manifest: {
        application: [
          {
            activity: [
              {
                $: {
                  'android:name': '.MainActivity',
                  'android:launchMode': 'singleTask',
                },
                'intent-filter': [
                  {
                    action: [
                      {
                        $: {
                          'android:name': 'android.intent.action.VIEW',
                        },
                      },
                    ],
                    category: [
                      {
                        $: {
                          'android:name': 'android.intent.category.DEFAULT',
                        },
                      },
                      {
                        $: {
                          'android:name': 'android.intent.category.BROWSABLE',
                        },
                      },
                    ],
                    data: [],
                  },
                ],
              },
            ],
            $: {
              'android:name': '.MainApplication',
            },
          },
        ],
        $: {
          'xmlns:android': 'http://schemas.android.com/apk/res/android',
          package: 'com.placeholder.appid',
        },
      },
    };
    const config = { slug: 'cello' };

    for (let i = 0; i < 2; i++) {
      androidManifest = setGeneratedAndroidScheme(config, androidManifest);

      expect(AndroidConfig.Scheme.getSchemesFromManifest(androidManifest)).toStrictEqual([
        'exp+cello',
      ]);
    }
  });

  it(`removes exp+ scheme when intent filter autoVerify is true`, () => {
    let androidManifest: AndroidManifest = {
      manifest: {
        application: [
          {
            activity: [
              {
                $: {
                  'android:name': '.MainActivity',
                  'android:launchMode': 'singleTask',
                },
                'intent-filter': [
                  {
                    $: {
                      'android:autoVerify': 'true',
                    },
                    action: [
                      {
                        $: {
                          'android:name': 'android.intent.action.VIEW',
                        },
                      },
                    ],
                    category: [
                      {
                        $: {
                          'android:name': 'android.intent.category.DEFAULT',
                        },
                      },
                      {
                        $: {
                          'android:name': 'android.intent.category.BROWSABLE',
                        },
                      },
                    ],
                    data: [],
                  },
                  {
                    action: [
                      {
                        $: {
                          'android:name': 'android.intent.action.VIEW',
                        },
                      },
                    ],
                    category: [
                      {
                        $: {
                          'android:name': 'android.intent.category.DEFAULT',
                        },
                      },
                      {
                        $: {
                          'android:name': 'android.intent.category.BROWSABLE',
                        },
                      },
                    ],
                    data: [],
                  },
                ],
              },
            ],
            $: {
              'android:name': '.MainApplication',
            },
          },
        ],
        $: {
          'xmlns:android': 'http://schemas.android.com/apk/res/android',
          package: 'com.placeholder.appid',
        },
      },
    };
    const config = { slug: 'cello' };
    androidManifest = setGeneratedAndroidScheme(config, androidManifest);
    androidManifest = removeExpoSchemaFromVerifiedIntentFilters(config, androidManifest);
    const schemes = AndroidConfig.Scheme.getSchemesFromManifest(androidManifest);
    expect(schemes.length).toEqual(1);
  });
});
