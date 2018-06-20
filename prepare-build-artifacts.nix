let

  pkgs = import ../.;

in

with pkgs;

mkShell {
  shellHook = ''
    cd ${builtins.toString ./js}
    cp ${exponent-js-app-json.expo.kernel.iosManifestPath} /tmp/ios-kernel-manifest.json
    cp ${exponent-js-app-json.expo.kernel.androidManifestPath} /tmp/android-kernel-manifest.json
    cp ${exponent-js-app-json.expo.ios.publishBundlePath} /tmp/kernel.ios.bundle
    cp ${exponent-js-app-json.expo.android.publishBundlePath} /tmp/kernel.android.bundle
    exit
  '';
}
