[
  "expo.sqlite.useSQLCipher",
  "expo.sqlite.useLibSQL",
  "expo.sqlite.enableFTS",
  "expo.sqlite.customBuildFlags",
].every { !providers.gradleProperty(it).isPresent() }
