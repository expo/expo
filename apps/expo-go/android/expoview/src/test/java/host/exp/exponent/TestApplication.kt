package host.exp.exponent

import android.app.Application
import android.content.Context
import host.exp.exponent.di.NativeModuleDepsProvider

class TestApplication : Application() {
  override fun attachBaseContext(base: Context) {
    super.attachBaseContext(base)
    NativeModuleDepsProvider.setTestInstance(NativeModuleDepsProvider(this))
  }

  override fun getApplicationContext(): Context = this
}
