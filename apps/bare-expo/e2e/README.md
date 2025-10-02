# e2e tests

### Prerequisites

- Install [Maestro CLI](https://maestro.mobile.dev/docs/getting-started/installation)
- (optional, recommended) Alignment with devices which are used in CI ([iOS](https://github.com/expo/expo/blob/051a306ce7c5b875f7398450e5aeec2e52e313ae/apps/bare-expo/scripts/start-ios-e2e-test.ts#L18), [Android](https://github.com/expo/expo/blob/051a306ce7c5b875f7398450e5aeec2e52e313ae/.github/actions/use-android-emulator/action.yml#L48)). This is necessary for assertions on what is visible on the screen and (especially) for screenshots to match.
- use the following command to generate the Android emulator:

```bash
avdmanager create avd --force -n pixel_7_pro --package 'system-images;android-36;google_apis;x86_64' --device pixel_7_pro
```

### Authoring e2e tests

1. A good way to start is with Maestro Studio: https://maestro.mobile.dev/studio, a tool for creating maestro flows. This is a good [intro video](https://www.youtube.com/watch?v=E7qwFwo_nu0&list=TLGG53BUjw5zwMAwODA5MjAyNQ).

2. Create a yaml file, or a folder with the yaml file in `apps/bare-expo/e2e`. This is where all tests live. Name your file with the `.android.yaml` / `.ios.yaml` suffix to have the CI run the test only on the given platform. Currently, **iOS is a bit unstable in GH actions**, especially when view shots are involved. This seems to depend on how lucky you are with the assigned GH actions runner.

3. Take a screen in NCL, adjust it for your e2e test needs (you can use `KeyValueBox` component to render values you want to test and use the "copy maestro assertions" button to get yaml that you can paste into your test file).

4. Start the screenshot server if you want to take and compare screenshots:

```bash
cd e2e/_nested-flows && bun --watch --no-clear-screen ./image-comparison-server.ts
```

5. In Maestro Studio, deep link into the screen and write your test. Here are the available [selectors](https://docs.maestro.dev/api-reference/selectors) and [commands](https://docs.maestro.dev/api-reference/commands). Studio will offer some guidance on the yaml syntax.

#### The dos and don'ts of authoring e2e tests

- Don't use too specific assertions. Example: don't assert that video resolution is exactly 1920x1080 — player could choose a different resolution based on network conditions or hardware. When in doubt, maybe assert on a different parameter entirely or use conservative ranges.
- Don't assert on looong visible text. Example: when you're using `assertVisible` with a multiline string, that assertion will be hard to maintain.
- Consider both platforms early on. It can save time later.
- Limit interactivity. It's not great to say this, but every tapping of a button or scrolling takes time and reduces reliability. The best tests are the ones that deep link to a screen and then do a few assertions.
- Use screenshots sparingly. They are invaluable for visual verification, but they add to test time and need to be updated when the UI or device changes. View shots "focus" on a specific view and can work cross-platform.
- Use `maestro hierarchy` for debugging selectors and understanding what maestro sees on the screen.
- Ensure every test takes care of starting from the state it expects to start from, and can run independently of others (no reliance on state left by a previous test).

### Running tests

You can run tests directly from the studio but there's a gotcha with screenshots — studio stores them at a wrong location (different from when you run from CLI). So for screenshots specifically, it's better to leave them to the end when you want to create them for a PR (just use the screenshot feature of the emulator).

To run tests from CLI, use the following command which picks up whatever device you have running:

```bash
cd apps/bare-expo/e2e
maestro --platform=ios test expo-image/test.yaml
```

Or use the [`--device` parameter](https://docs.maestro.dev/advanced/specify-a-device#obtain-the-device-identifier).

You can also run tests in parallel on both iOS and Android emulators/simulators. For example, to run on 2 devices in parallel:

```bash
maestro test expo-video/test.yaml --shard-all 2
```

### Troubleshooting

Maestro creates a folder at `./maestro` where you'll find logs and screenshots for when an assertion failed. If a screenshot fails, look at the logs of the screenshot server, it includes path to a screenshot diff.

When running in CI, the artifacts (logs, screenshots, screenshot diffs) are uploaded as artifacts and you can download them directly from slack failure message. Also the workflow run logs have a `Artifacts download URL` where you can download them.

There's also a maestro slack channel.

Notable durations (iOS device startup, time to run a test) are present in the logs - search for "duration".
