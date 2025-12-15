package expo.modules.plugin.utils

fun String.camelToKebab(): String {
  val builder = StringBuilder()
  for (char in this) {
    if (char.isUpperCase()) {
      builder.append("-")
      builder.append(char.lowercaseChar())
    } else {
      builder.append(char)
    }
  }
  return builder.toString()
}
