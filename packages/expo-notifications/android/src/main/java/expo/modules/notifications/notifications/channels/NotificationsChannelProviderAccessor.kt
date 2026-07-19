package expo.modules.notifications.notifications.channels

import expo.modules.kotlin.ModuleRegistry

internal interface NotificationsChannelProviderAccessor {
  fun getChannelProvider(registry: ModuleRegistry): NotificationsChannelsProvider {
    return registry.getModule(NotificationsChannelsProviderName) as NotificationsChannelsProvider
  }
}
