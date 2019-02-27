# expo-errors

`expo-errors` is an internal module in Expo that help us standardize error handling across all of our modules and provide a place for all error-related code to live.

## deprecate

This method will warn once if someone attempts to use deprecated API.
If the deprecated version is lower than the current version, a `CodedError` will be thrown. This will help developers identify what code needs to be removed.

```ts
import { deprecate } from 'expo-errors';
import pckgJson from '../package.json';

/** Deleting a property. ex: In the next version foo will be removed.  */
deprecate('expo-example-library', 'foo', {
  currentVersion: pckgJson.version,
  versionToRemove: '2.0.0',
});

/** Replacing a property. ex: I want to use the name bar instead of foo. */
deprecate('expo-example-library', 'foo', {
  replacement: 'bar',
  currentVersion: pckgJson.version,
  versionToRemove: '2.0.0',
});

/** Bad Form: Throw a deprecation error. */
deprecate('expo-example-library', 'foo');
deprecate('expo-example-library', 'foo', { replacement: 'bar' });
```
