package expo.modules.plugin

/**
 * Builder for creating command to run using `expo-modules-autolinking`.
 */
class AutolinkigCommandBuilder {
  /**
   * Command for finding and running the `expo-modules-autolinking`.
   */
  private val baseCommand = listOf(
    "node",
    "--no-warnings",
    "--eval",
    "require(require.resolve('expo-modules-autolinking', { paths: [require.resolve('expo/package.json')] }))(process.argv.slice(1))",
    "--"
  )

  private val platform = listOf(
    "--platform",
    "android"
  )

  private var autolinkingCommand = emptyList<String>()
  private var useJson = emptyList<String>()
  private val optionsMap = mutableMapOf<String, String>()

  /**
   * Set the autolinking command to run.
   */
  fun command(command: String) = apply {
    autolinkingCommand = listOf(command)
  }

  /**
   * Add an option to the command.
   */
  fun option(key: String, value: String) = apply {
    optionsMap[key] = value
  }

  /**
   * Whether is should output the json.
   */
  fun useJson() = apply {
    useJson = listOf("--json")
  }

  fun build(): List<String> {
    val command = baseCommand +
      autolinkingCommand +
      platform +
      useJson +
      optionsMap.map { (key, value) -> listOf("--$key", value) }.flatMap { it }
    return Os.windowsAwareCommandLine(command)
  }
}
