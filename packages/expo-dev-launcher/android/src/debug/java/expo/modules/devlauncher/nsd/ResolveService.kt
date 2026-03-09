package expo.modules.devlauncher.nsd

import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.os.Build
import androidx.annotation.RequiresApi
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

@Suppress("DEPRECATION")
private suspend fun NsdManager.resolveServiceLegacyImpl(
  serviceInfo: NsdServiceInfo
): NsdServiceInfo = suspendCancellableCoroutine { cont ->
  this.resolveService(
    serviceInfo,
    object : NsdManager.ResolveListener {
      override fun onResolveFailed(info: NsdServiceInfo, errorCode: Int) {
        if (cont.isActive) {
          cont.resumeWithException(
            RuntimeException("Resolve failed: errorCode=$errorCode")
          )
        }
      }

      override fun onServiceResolved(resolvedInfo: NsdServiceInfo) {
        if (cont.isActive) {
          cont.resume(resolvedInfo)
        }
      }
    }
  )
}

@RequiresApi(Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
private suspend fun NsdManager.resolveServiceImpl(
  serviceInfo: NsdServiceInfo
): NsdServiceInfo = suspendCancellableCoroutine { cont ->
  val manger = this

  val callback = object : NsdManager.ServiceInfoCallback {
    override fun onServiceInfoCallbackRegistrationFailed(errorCode: Int) {
      if (cont.isActive) {
        cont.resumeWithException(
          RuntimeException("Service info callback registration failed: errorCode=$errorCode")
        )
      }
    }

    override fun onServiceUpdated(resolvedInfo: NsdServiceInfo) {
      manger.unregisterServiceInfoCallback(this)
      if (cont.isActive) {
        cont.resume(resolvedInfo)
      }
    }

    override fun onServiceLost() {
      manger.unregisterServiceInfoCallback(this)
      if (cont.isActive) {
        cont.resumeWithException(RuntimeException("Service lost during resolution"))
      }
    }

    override fun onServiceInfoCallbackUnregistered() = Unit
  }

  cont.invokeOnCancellation {
    runCatching {
      manger.unregisterServiceInfoCallback(callback)
    }
  }

  manger.registerServiceInfoCallback(serviceInfo, { it.run() }, callback)
}

suspend fun NsdManager.resolveServiceCoroutine(
  serviceInfo: NsdServiceInfo
): NsdServiceInfo {
  return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
    resolveServiceImpl(serviceInfo)
  } else {
    resolveServiceLegacyImpl(serviceInfo)
  }
}
