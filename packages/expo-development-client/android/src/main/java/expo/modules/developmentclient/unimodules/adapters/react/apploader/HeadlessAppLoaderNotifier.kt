package org.unimodules.adapters.react.apploader

import java.lang.ref.WeakReference

interface HeadlessAppLoaderListener {

  fun appLoaded(appId: String)

  fun appDestroyed(appId: String)

}

object HeadlessAppLoaderNotifier {

  val listeners: MutableSet<WeakReference<HeadlessAppLoaderListener>> = mutableSetOf()

  fun registerListener(listener: HeadlessAppLoaderListener) {
    listeners.add(WeakReference(listener))
  }

  fun notifyAppLoaded(appId: String?) {
    if (appId != null) {
      listeners.forEach { it.get()?.appLoaded(appId) }
    }
  }

  fun notifyAppDestroyed(appId: String?) {
    if (appId != null) {
      listeners.forEach { it.get()?.appDestroyed(appId) }
    }
  }

}