package expo.modules.plugin.utils

internal object Env {
  /**
   * A wrapper around [System.getenv] that we can setup mock for testing.
   */
  fun getProcessEnv(name: String): String? = System.getenv(name)
}
