package expo.modules.devmenu

interface DevMenuActivityLifecycleHandler {
  fun devMenuHasBeenOpened(devMenuActivity: DevMenuActivity)

  fun devMenuHasBeenDestroyed()
}
