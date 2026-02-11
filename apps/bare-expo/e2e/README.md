# E2E tests

### Prerequisites

- Install [Maestro CLI](https://maestro.mobile.dev/docs/getting-started/installation)
- `brew install oxipng` for image compression
- run `yarn install` in `bare-expo/e2e/image-comparison`
- (optional, recommended) Alignment with devices which are used in CI ([iOS](https://github.com/expo/expo/blob/051a306ce7c5b875f7398450e5aeec2e52e313ae/apps/bare-expo/scripts/start-ios-e2e-test.ts#L18), [Android](https://github.com/expo/expo/blob/051a306ce7c5b875f7398450e5aeec2e52e313ae/.github/actions/use-android-emulator/action.yml#L48)). This is necessary for assertions on what is visible on the screen and (especially) for view shots to match.
- (optional, recommended) Build the iOS screen inspector - run `./scripts/build.sh` in `bare-expo/e2e/image-comparison/inspector`. You can learn more about the inspector in its [README.md](./image-comparison/inspector/README.md)
- use the following commands to generate the Android emulator:

```bash
# Install the system image:
sdkmanager "system-images;android-36;google_apis;arm64-v8a"
# Create the emulator:
avdmanager create avd --force -n pixel_7_pro --package 'system-images;android-36;google_apis;arm64-v8a' --device pixel_7_pro
```

### Authoring e2e tests

1. A good way to start is with Maestro Studio: https://maestro.mobile.dev/studio, a tool for creating maestro flows, but it's by no means necessary. This is a good [intro video](https://www.youtube.com/watch?v=E7qwFwo_nu0&list=TLGG53BUjw5zwMAwODA5MjAyNQ).

2. Create a yaml file, or a folder with the yaml file in `apps/bare-expo/e2e`. This is where all tests live. Name your file with the `.android.yaml` / `.ios.yaml` suffix to have the CI run the test only on the given platform. Currently, **iOS can be a bit unstable in GH actions**, especially when view shots are involved.

3. Take a screen component in NCL, adjust it for your e2e test needs. You can use `KeyValueBox` component to render keys and values you want to assert on, and use the "copy maestro assertions" button to get yaml that to paste into your test file. To take view shots (=png image of a rendered component), use the `E2EViewShotContainer` and pass the view you want to capture as child.

4. Start the image comparison server if you want to take and compare view shots. Use the `buildInspector` script in `apps/bare-expo/e2e/image-comparison/package.json`, and then either `start` or `dev` script if you want to just run, or make changes to the server, respectively.

5. In Maestro Studio, deep link into the chosen screen and write your test. Here are the available [selectors](https://docs.maestro.dev/api-reference/selectors) and [commands](https://docs.maestro.dev/api-reference/commands). Studio will offer some guidance on the yaml syntax.

#### Do's and don'ts of authoring E2E tests

- Don't use too specific assertions. Example: don't assert that a video resolution is exactly 1920x1080 — player could choose a different resolution based on network conditions or hardware. When in doubt, maybe assert on a different parameter entirely or use conservative ranges.
- Don't assert on long visible text. Example: when you're using `assertVisible` with a multiline string, that assertion will be hard to maintain. Also, smaller assertions are easier to find and fix when they fail.
- use the `E2EViewShotContainer` and `E2EKeyValueBox` components to render pieces of UI and get maestro yaml assertions for what you place in them
- Consider both platforms early on. It can save time later.
- Limit interactivity. It's not great to say this, but every tapping of a button or scrolling takes time and reduces reliability. The best tests are the ones that deep link to a screen and then do a few assertions.
- View shots "focus" on a specific view and can work cross-platform (view shots taken on different platforms can be normalized to allow their comparison even though they have different sizes). They are the main tool for visual verification, but they add to test time and may need to be updated when the UI, OS or device changes, so don't overuse them.
- Use `maestro hierarchy` for debugging selectors and understanding what maestro sees on the screen.
- Ensure every test takes care of starting from the state it expects to start from and can run independently of others (no reliance on state left by a previous test).

### Running tests

You can run tests directly from the studio but there's a gotcha with view shots — studio stores them at a wrong location (different from when you run from CLI). So for view shots specifically, it's better to leave them to the end when you want to create them for a PR.

To run tests from CLI, use the following command which picks up whatever device you have running:

```bash
cd apps/bare-expo/e2e
maestro --platform=ios test expo-image/test.yaml
```

Or use the [`--device` parameter](https://docs.maestro.dev/advanced/specify-a-device#obtain-the-device-identifier).

You can also run tests in parallel on both iOS and Android emulators/simulators. For example, to run on two devices in parallel:

```bash
maestro test expo-video/test.yaml --shard-all 2
```

To run the tests the same way they'd run in CI, you can do `cd apps/bare-expo/scripts` and `./start-ios-e2e-test.ts --test` or `./start-android-e2e-test.ts --test` - but you shouldn't need this.

### Comparing images

Comparison works by always keeping a base image committed in the repository (`.base.png` for cross-platform view shots, or `.base.${platform}.png` for platform-specific view shots). To get the base image, run the test and rename the viewshot that it saves to `${oldName}.base.png` (if normalized) or `${oldName}.base.${platform}.png` if not normalized.

During CI, a new view shot is taken and compared to the base image. Based on the comparison result, the test assertion either passes or fails. For examples, see use of `_nested-flows/viewshot-comparison.yaml`.
The shots, as well as diffs against the base images are stored as GH artifacts in CI, and so are the logs of the image comparison server.

### Troubleshooting

- Maestro creates a folder at `./maestro` where you'll find logs, failed view shot diffs, and screenshots for when an assertion failed. If a view shot fails, look at the logs of the image comparison server; it includes path to the image diff.

- When running in CI, the artifacts (logs, screenshots, view shot diffs) are uploaded as artifacts, and you can download them directly from slack failure message. Also the workflow run logs have a `Artifacts download URL` where you can download them.

- Notable durations (iOS device startup, time to run a test, time to obtain view coordinates) are present in the logs - search for "duration".

- To test the viewshot capture and view cropping independently from the full test flow, use the `debug-viewshot` script in package.json
