package expo.modules.plugin.text

object Colors {
  const val GREEN = "\u001B[32m"
  const val YELLOW = "\u001B[33m"
  const val RESET = "\u001B[0m"
}

fun Any?.withColor(color: String): String {
  return "$color$this${Colors.RESET}"
}
