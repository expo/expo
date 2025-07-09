package expo.modules.devlauncher.services

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.lifecycle.ViewModel
import expo.modules.devlauncher.DevLauncherController

/**
 * Simple dependency injection container for DevLauncher.
 * Works as a singleton, so all services are shared across the app.
 */
object DependencyInjection {
  var wasInitialized: Boolean = false
    private set

  var httpClientService: HttpClientService? = null
    private set

  var imageLoaderService: ImageLoaderService? = null
    private set

  var sessionService: SessionService? = null
    private set

  var apolloClientService: ApolloClientService? = null
    private set

  var devLauncherController: DevLauncherController? = null
    private set

  fun init(context: Context, devLauncherController: DevLauncherController) = synchronized(this) {
    if (wasInitialized) {
      return
    }

    wasInitialized = true

    this.devLauncherController = devLauncherController

    val httpClient = HttpClientService()

    httpClientService = httpClient

    imageLoaderService = ImageLoaderService(
      context = context.applicationContext,
      httpClientService = httpClient
    )

    val apolloClient = ApolloClientService()

    apolloClientService = apolloClient

    sessionService = SessionService(
      sessionStore = context.applicationContext.getSharedPreferences("expo.modules.devlauncher.session", Context.MODE_PRIVATE),
      apolloClientService = apolloClient
    )
  }
}

@PublishedApi
internal inline fun <reified T> injectService(): T {
  return when (T::class) {
    SessionService::class -> DependencyInjection.sessionService
    ApolloClientService::class -> DependencyInjection.apolloClientService
    ImageLoaderService::class -> DependencyInjection.imageLoaderService
    HttpClientService::class -> DependencyInjection.httpClientService
    DevLauncherController::class -> DependencyInjection.devLauncherController
    else -> throw IllegalArgumentException("Unknown service type: ${T::class}")
  } as T
}

inline fun <reified T> ViewModel.inject(): T {
  return injectService<T>()
}

@Composable
inline fun <reified T> inject(): T {
  return injectService<T>()
}
