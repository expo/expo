package expo.modules.plugin

/**
 * Builder for creating command to run using `expo-modules-autolinking`.
 */
class AutolinkigCommandBuilder {
  /**
   * Command for finding and running `expo-modules-autolinking`.
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
  private var searchPaths = emptyList<String>()

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
   * Add a list of values as an option to the command.
   */
  fun option(key: String, value: List<String>) = apply {
    optionsMap[key] = value.joinToString(" ")
  }

  /**
   * Whether it should output json.
   */
  fun useJson() = apply {
    useJson = listOf("--json")
  }

  /**
   * Set the search paths for the autolinking script.
   */
  fun searchPaths(paths: List<String>) = apply {
    searchPaths = paths
  }

  fun useAutolinkingOptions(autolinkingOptions: AutolinkingOptions) = apply {
    autolinkingOptions.ignorePaths?.let { option(IGNORE_PATHS_KEY, it) }
    autolinkingOptions.exclude?.let { option(EXCLUDE_KEY, it) }
    autolinkingOptions.searchPaths?.let { searchPaths(it) }
  }

  fun build(): List<String> {
    val command = baseCommand +
      autolinkingCommand +
      platform +
      useJson +
      optionsMap.map { (key, value) -> listOf("--$key", value) }.flatMap { it } +
      searchPaths
    return Os.windowsAwareCommandLine(command)
  }

  companion object {
    const val IGNORE_PATHS_KEY = "ignore-paths"
    const val EXCLUDE_KEY = "exclude"
  }
}
