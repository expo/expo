[
  "expo.sqlite.useSQLCipher",
  "expo.sqlite.useLibSQL",
  "expo.sqlite.enableFTS",
  "expo.sqlite.customBuildFlags",
].every { !settings.providers.gradleProperty(it).isPresent() }
