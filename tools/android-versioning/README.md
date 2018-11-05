### How to version imagepipeline-okhttp3
Update
```
const AAR_LIBRARY = {
  group: 'com.facebook.fresco',
  name: 'imagepipeline-okhttp3',
  version: '1.3.0',
};
const AAR_JAR_JAR_RULES_FILE = 'okhttpjarjar.txt';
const AAR_NAMESPACE = 'expolib_v1';
```
in android-version-libraries.js

Run `gulp android-jarjar-on-aar` in exponent/tools
