self: super:

{
  # TODO: delete after upstream update
  # https://github.com/NixOS/nixpkgs/pull/48494
  xcpretty = self.bundlerEnv {
    inherit (self) ruby;
    pname = "xcpretty";
    gemdir = ./xcpretty;
  };

  inherit
    (super.callPackage ./nodepackages { pkgs = self; })
    expo-cli
    ;
}
