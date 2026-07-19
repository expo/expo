# Updating the Versions endpoint

The [versions endpoint](https://expo.io/--/api/v2/versions) ([staging](https://staging.expo.io/--/api/v2/versions)) returns a JSON object containing information that is useful primarily in expo-cli for installing simulator builds, validating package versions, ejecting, and upgrading packages. It can also be used for any other purposes where similar information is required, for example linking to release notes from the website.

## Using the CLI to update keys

To update a key on staging, run `et update-versions-endpoint --sdkVersion=35.0.0 --key="myKey" --value="myValue"`. You will then be shown a diff of your change, which you can approve or reject before the change is commit to staging. To apply this change to production, run `et promote-versions-to-production`.

## Required related package versions

As of SDK 34, each SDK version should include a `relatedPackages` key with at least the following packages:

- `@types/react`
- `@types/react-native`
- `typescript`
- `react-native-web`
- `babel-preset-expo`
- `react-native-unimodules`

You can set these using the same `update-versions-endpoint` script using the dot notation, eg: `et update-versions-endpoint --sdkVersion=35.0.0 --key="relatedPackages.@types/react-native" --value="^0.57.65"`.