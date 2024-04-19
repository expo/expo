package expo.modules.devlauncher.launcher

import android.app.Application
import com.facebook.react.ReactHost
import expo.modules.devlauncher.DEV_LAUNCHER_IS_NOT_AVAILABLE

object DevLauncherReactHost {
  fun create(application: Application, launcherIp: String?): ReactHost {
    throw IllegalStateException(DEV_LAUNCHER_IS_NOT_AVAILABLE)
  }
}
