self: super:

{
  xcpretty = assert !(builtins.hasAttr "xcpretty" super); super.bundlerApp {
    pname = "xcpretty";
    gemdir = ./xcpretty;
    exes = [ "xcpretty" ];
  };

  nodejs = super.nodejs-10_x;

  yarn2nix-src = super.fetchFromGitHub {
    owner = "moretea";
    repo = "yarn2nix";
    rev = "12de02f4d06771dffc92cdd8989be55fd2dbe95c";
    sha256 = "08ngpi5mygyvbq0w3fdxclm77giavhhrf3qgl86rxli8xfzi70v9";
  };

  yarn2nix = import self.yarn2nix-src { pkgs = self; };

  externalNodePackages =
    let
      generatedNodePackages = super.callPackage ./nodepackages { pkgs = self; };
    in
      generatedNodePackages // {
        expo-cli = generatedNodePackages.expo-cli.override {
          nativeBuildInputs = [ self.makeWrapper ];
          postInstall = ''
            for p in $out/bin/expo{,-cli}; do
              wrapProgram $p --prefix PATH : ${self.procps}/bin
            done
          '';
          preFixup = super.lib.optionalString super.stdenv.isDarwin ''
            detach="$out/lib/node_modules/expo-cli/node_modules/xdl/build/detach"
            substituteInPlace "$detach/IosShellApp.js" --replace xcpretty ${self.xcpretty}/bin/xcpretty
            substituteInPlace "$detach/IosShellApp.js" --replace "'pod'" "'${self.cocoapods}/bin/pod'"
            for f in Ios{CodeSigning,Keychain}.js; do
              substituteInPlace "$detach/$f" --replace "'fastlane'" "'${self.fastlane}/bin/fastlane'"
            done
         '';
        };
      };

  inherit (self.externalNodePackages)
    expo-cli
    ;
  
  expotools = self.yarn2nix.mkYarnPackage {
    src = self.lib.sourceByExcludingRegex ../tools/expotools ["build" "node_modules"];

    buildPhase = "yarn prepare";

    doCheck = false;

    doInstallCheck = true;
    installCheckPhase = ''
      export __UNSAFE_EXPO_HOME_DIRECTORY=$(mktemp -d)
      $out/bin/expotools --help
    '';

    preFixup = ''
      substituteInPlace $out/libexec/expotools/deps/expotools/build/TestServer.js \
        --replace "'ngrok'" "'${self.ngrok}/bin/ngrok'"
    '';
  };

  lib = super.lib // {
    sourceByExcludingRegex = src: regexes: super.lib.cleanSourceWith {
      filter = (path: type:
        let relPath = super.lib.removePrefix (toString src + "/") (toString path);
        in super.lib.all (re: builtins.match re relPath == null) regexes);
      inherit src;
    };
  };
}
