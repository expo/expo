[
  "expo.sqlite.useSQLCipher",
  "expo.sqlite.useLibSQL",
  "expo.sqlite.enableFTS",
  "expo.sqlite.customBuildFlags",
].any { settings.providers.gradleProperty(it).isPresent() }
