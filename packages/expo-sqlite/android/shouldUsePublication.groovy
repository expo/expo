def useSQLCipher = settings.providers.gradleProperty("expo.sqlite.useSQLCipher").getOrElse("false")
def useLibSQL = settings.providers.gradleProperty("expo.sqlite.useLibSQL").getOrElse("false")

useLibSQL == "false" && useSQLCipher == "false"
