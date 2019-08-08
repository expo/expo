with (import ../nix {});

let

  # These expressions can be deleted when react native depends on version of
  # ndk present in nixpkgs.
  os = if stdenv.system == "x86_64-linux" then "linux"
    else if stdenv.system == "x86_64-darwin" then "macosx" else throw "unsupported system architecture: ${stdenv.system}";
  ndk_17c_src = if stdenv.isDarwin then fetchurl {
    url = http://dl.google.com/android/repository/android-ndk-r17c-darwin-x86_64.zip;
    sha256 = "11iyxgqp017fchn54kkns9mrax73m73xm5wgis266dsq2g36dn73";
  } else fetchurl {
    url = https://dl.google.com/android/repository/android-ndk-r17c-linux-x86_64.zip;
    sha256 = "12b5h5p8b2ia38825dnnacn7b47c0inpys8jp82r42iks3dilm1z";
  };
  ndk_runtime_paths = lib.makeBinPath [ coreutils file findutils gawk gnugrep gnused jdk python3 which ]; #+ ":${platform-tools}/platform-tools";
  ndk = stdenv.mkDerivation {
    name = "ndk-17c";
    src = ndk_17c_src;
    buildInputs = [ unzip autoPatchelfHook makeWrapper python2 ] ++ lib.optional (os == "linux") [ glibc stdenv.cc.cc ncurses5 zlib libcxx.out ];
    unpackPhase = ''
      mkdir extractedzip
      cd extractedzip
      unpackFile "$src"
      if [ "$(find . -mindepth 1 -maxdepth 1 -type d | wc -l)" -eq 1 ]
      then
          cd "$(find . -mindepth 1 -maxdepth 1 -type d)"
      fi
      sourceRoot="$PWD"
    '';

   installPhase = ''
     packageBaseDir=$out/libexec/android-sdk/ndk-bundle
     mkdir -p $packageBaseDir
     cd $packageBaseDir
     cp -av $sourceRoot/* .
   '' + lib.optionalString (os == "linux") ''
     patchShebangs .
     wrapProgram $(pwd)/build/tools/make_standalone_toolchain.py --prefix PATH : "${ndk_runtime_paths}"
     rm -rf docs tests
     # Patch the executables of the toolchains, but not the libraries -- they are needed for crosscompiling
     addAutoPatchelfSearchPath $out/libexec/android-sdk/ndk-bundle/toolchains/renderscript/prebuilt/linux-x86_64/lib64
     find toolchains -type d -name bin | while read dir
     do
         autoPatchelf "$dir"
     done
     # fix ineffective PROGDIR / MYNDKDIR determination
     for i in ndk-build
     do
         sed -i -e 's|^PROGDIR=`dirname $0`|PROGDIR=`dirname $(readlink -f $(which $0))`|' $i
     done
     # Patch executables
     autoPatchelf prebuilt/linux-x86_64
     # wrap
     for i in ndk-build
     do
         wrapProgram "$(pwd)/$i" --prefix PATH : "${ndk_runtime_paths}"
     done
     # make some executables available in PATH
     mkdir -p $out/bin
     for i in ndk-build
     do
         ln -sf ../../libexec/android-sdk/ndk-bundle/$i $out/bin/$i
     done
   '';
   dontStrip = true;
   dontPatchELF = true;
   dontAutoPatchelf = true;
   noAuditTmpdir = true;
  };
  ndkRoot = "${ndk}/libexec/android-sdk/ndk-bundle";

  sdk = androidenv.androidPkgs_9_0.androidsdk;
  sdk_path = if stdenv.isDarwin
    then "/Library/Android/sdk"
    else "/Android/Sdk"; # intentional Capital S

in

mkShell rec {

  LANG="en_US.UTF-8";
  JAVA_HOME=openjdk8;

  ANDROID_SDK_ROOT=builtins.getEnv("HOME") + sdk_path;
  ANDROID_NDK_ROOT="${ANDROID_SDK_ROOT}/ndk-bundle";
  ANDROID_HOME=ANDROID_SDK_ROOT;
  ANDROID_NDK=ANDROID_NDK_ROOT;

  nativeBuildInputs = [
    awscli
    curl
    fastlane
    git
    nodejs
    openjdk8
    yarn
  ];

  passthru = { inherit ndk ndkRoot; };

  shellHook = ''
    ${./install-ndk-17c.sh} ${ndk} ${ndkRoot}
    # grep -v = should clean up build logs, see https://stackoverflow.com/a/52464819/1123156
    yes | ${sdk}/bin/sdkmanager --sdk_root="$ANDROID_SDK_ROOT" "build-tools;28.0.3" | grep -v =
  '' + lib.optionalString stdenv.isLinux ''
    for dep in lib lib64; do
      if [ -L /$dep ] || [ ! -e /$dep ]; then
        echo "Creating /$dep"
        ln -s ${stdenv.cc.libc}/$dep /$dep
      else
        echo "Using existing /$dep"
      fi
    done
  '';
}
