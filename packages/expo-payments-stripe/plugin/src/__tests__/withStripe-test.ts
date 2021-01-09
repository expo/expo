import { withStripeIos, ensureStripeActivity } from '../withStripe';

describe(withStripeIos, () => {
  it(`adds uri schemes`, () => {
    expect(
      // @ts-ignore: not on type yet
      withStripeIos({ name: 'foo', slug: 'bar' }, { scheme: 'custom' }).ios?.scheme
    ).toStrictEqual(['custom']);
  });
});

describe(ensureStripeActivity, () => {
  it(`adds an activity`, () => {
    let app = ensureStripeActivity({
      mainApplication: {
        $: {
          'android:name': 'Stripe',
        },
      },
      scheme: 'custom',
    });
    expect(app).toStrictEqual({
      $: {
        'android:name': 'Stripe',
      },
      activity: [
        {
          $: {
            'android:exported': 'true',
            'android:launchMode': 'singleTask',
            'android:name': 'expo.modules.payments.stripe.RedirectUriReceiver',
            'android:theme': '@android:style/Theme.Translucent.NoTitleBar.Fullscreen',
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
              data: [
                {
                  $: {
                    'android:scheme': 'custom',
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    // Test that it doesn't add copies
    app = ensureStripeActivity({
      mainApplication: app,
      scheme: 'other',
    });

    expect(app.activity?.length).toBe(1);
  });
});
