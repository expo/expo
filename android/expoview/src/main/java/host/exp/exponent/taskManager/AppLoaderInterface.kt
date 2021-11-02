package host.exp.exponent.taskManager

import expo.modules.apploader.AppLoaderProvider

interface AppLoaderInterface {
  fun loadApp(
    appUrl: String,
    options: Map<String, Any>,
    callback: AppLoaderProvider.Callback
  ): AppRecordInterface
}
