self: super:

{
  fastlane =
    super.bundlerApp {
      pname = "fastlane";
      gemdir = ./fastlane;
      exes = [ "fastlane" ];
      buildInputs = [ super.makeWrapper ];
      postBuild = ''
        wrapProgram $out/bin/fastlane \
          --set FASTLANE_SKIP_UPDATE_CHECK 1
      '';
    };

  nodejs = super.nodejs-10_x;

  yarn2nix-src = super.fetchFromGitHub {
    owner = "moretea";
    repo = "yarn2nix";
    rev = "12de02f4d06771dffc92cdd8989be55fd2dbe95c";
    sha256 = "08ngpi5mygyvbq0w3fdxclm77giavhhrf3qgl86rxli8xfzi70v9";
  };

  yarn2nix = import self.yarn2nix-src { pkgs = self; };

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
