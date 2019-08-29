Usage:

1. `git clone git@github.com:Bresiu/android-manifest-merger.git`

2. mvn install

3. `java -jar target/manifest-merger-jar-with-dependencies.jar  --main mainAndroidManifest.xml`

```
--log [VERBOSE, INFO, WARNING, ERROR]
--libs [path separated list of lib's manifests]
--overlays [path separated list of overlay's manifests]
--property [PACKAGE | VERSION_CODE | VERSION_NAME | MIN_SDK_VERSION | TARGET_SDK_VERSION | MAX_SDK_VERSION=value]
--placeholder [name=value]
--out [path of the output file]
```

I have used this library as follows:

`java -jar target/manifest-merger-jar-with-dependencies.jar --main <path_to_main_manifest> --libs <path_to_libs_manifests_divided by ':'> --out <output_manifest> --log WARNING`
