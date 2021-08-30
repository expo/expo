package expo.modules.adapters.react.apploader

import java.lang.ref.WeakReference

interface HeadlessAppLoaderListener {

  fun appLoaded(appScopeKey: String)

  fun appDestroyed(appScopeKey: String)
}

object HeadlessAppLoaderNotifier {

  val listeners: MutableSet<WeakReference<HeadlessAppLoaderListener>> = mutableSetOf()

  fun registerListener(listener: HeadlessAppLoaderListener) {
    listeners.add(WeakReference(listener))
  }

  fun notifyAppLoaded(appScopeKey: String?) {
    if (appScopeKey != null) {
      listeners.forEach { it.get()?.appLoaded(appScopeKey) }
    }
  }

  fun notifyAppDestroyed(appScopeKey: String?) {
    if (appScopeKey != null) {
      listeners.forEach { it.get()?.appDestroyed(appScopeKey) }
    }
  }
}
