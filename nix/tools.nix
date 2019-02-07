self: super:

{
  s3env = super.buildEnv {
    name = "s3env";
    paths = with self; [
      awscli
    ];
  };
}
