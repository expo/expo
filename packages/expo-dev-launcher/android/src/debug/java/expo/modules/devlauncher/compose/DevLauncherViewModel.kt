package expo.modules.devlauncher.compose

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import expo.modules.devlauncher.services.PackagerService
import okhttp3.OkHttpClient

class DevLauncherViewModel : ViewModel() {
  val httpClient = OkHttpClient()
  val packagerService = PackagerService(httpClient, viewModelScope)
}
