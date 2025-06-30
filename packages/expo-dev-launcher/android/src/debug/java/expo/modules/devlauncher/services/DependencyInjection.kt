package expo.modules.devlauncher.services

import android.content.Context
import androidx.lifecycle.ViewModel

/**
 * Simple dependency injection container for DevLauncher.
 * Works as a singleton, so all services are shared across the app.
 */
object DependencyInjection {
  var wasInitialized: Boolean = false
    private set

  var sessionService: SessionService? = null
    private set

  var apolloClientService: ApolloClientService? = null
    private set

  fun init(context: Context) = synchronized(this) {
    if (wasInitialized) {
      return
    }

    wasInitialized = true

    val apolloClient = ApolloClientService()

    apolloClientService = apolloClient

    sessionService = SessionService(
      sessionStore = context.applicationContext.getSharedPreferences("expo.modules.devlauncher.session", Context.MODE_PRIVATE),
      apolloClientService = apolloClient
    )
  }
}

@Suppress("UNCHECKED_CAST")
inline fun <reified T> ViewModel.inject(): T {
  return when (T::class) {
    SessionService::class -> DependencyInjection.sessionService
    ApolloClientService::class -> DependencyInjection.apolloClientService
    else -> throw IllegalArgumentException("Unknown service type: ${T::class}")
  } as T
}
