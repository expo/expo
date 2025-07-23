package expo.modules.plugin

object Os {
  fun isWindows(): Boolean =
    System.getProperty("os.name")?.lowercase()?.contains("windows") == true

  fun windowsAwareCommandLine(args: List<String>): List<String> =
    if (isWindows()) {
      listOf("cmd", "/c") + args
    } else {
      args
    }
}
