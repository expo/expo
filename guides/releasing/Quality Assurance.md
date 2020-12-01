# Quality Assurance

## 1. Checking packages

- Run `et check-packages` to make sure every package build successfully, `build` folder is up to date and all unit tests pass. 

## 2. Running test-suite tests

- Go to `apps/test-suite`.
- Update its `sdkVersion` in `app.json`.
- Run `expo start` and test each module.

## 3. Inspecting native-component-list examples

- Go to `apps/native-component-list`.
- Update its `sdkVersion` in `app.json`.
- Update versions of the dependencies in `package.json`.
- Run `expo start` and check every example, including React Native components.

## 4. Smoke test Expo Go against all supported SDK versions

- Run `expo init -t blank@sdk-x` for each supported SDK version and ensure the project loads without crashing.