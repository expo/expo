package host.exp.exponent.kernel

import android.os.Bundle

interface DevMenuModuleInterface {
  fun getManifestUrl(): String
  fun getInitialProps(): Bundle
  fun getMenuItems(): Bundle
  fun selectItemWithKey(itemKey: String)
  fun reloadApp()
  fun isDevSupportEnabled(): Boolean
}
