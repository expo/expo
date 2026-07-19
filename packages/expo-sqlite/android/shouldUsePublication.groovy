[
  "expo.sqlite.useSQLCipher",
  "expo.sqlite.useLibSQL",
  "expo.sqlite.enableFTS",
  "expo.sqlite.customBuildFlags",
  "expo.sqlite.withSQLiteVecExtension",
].every { !providers.gradleProperty(it).isPresent() }
