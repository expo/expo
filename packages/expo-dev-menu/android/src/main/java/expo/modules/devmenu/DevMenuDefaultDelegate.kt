package expo.modules.devmenu

import android.os.Bundle
import com.facebook.react.ReactHost

class DevMenuDefaultDelegate(
  private val delegateHost: ReactHost
) {
  fun appInfo(): Bundle? = null

  fun reactHost(): ReactHost = delegateHost
}
