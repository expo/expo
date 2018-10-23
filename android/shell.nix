with (import ../. {});

let

  sdk = androidenv.androidsdk {
     platformVersions = [ "26" "27" ];
     buildToolsVersions = [ "27.0.3" ];
     abiVersions = [ "x86" "x86_64" ];
     useGoogleAPIs = true;
     useExtraSupportLibs = true;
     useGooglePlayServices = true;
     useInstantApps = true;
   };
   sdk_root = "${sdk}/libexec";

   ndk = androidenv.androidndk_17c.override { fullNDK = true; };
   ndk_root = "${ndk}/libexec/${ndk.name}";

in

mkShell {

  LANG="en_US.UTF-8";
  JAVA_HOME=openjdk8;
  ANDROID_SDK_ROOT=sdk_root;
  ANDROID_NDK_ROOT=ndk_root;
  # Deprecated variables, currently used by React Native
  ANDROID_HOME=sdk_root;
  ANDROID_NDK_HOME=ndk_root;

  nativeBuildInputs = [
    nodejs-8_x
    openjdk8
    sdk
  ];
  passthru = { inherit sdk ndk; };
}
