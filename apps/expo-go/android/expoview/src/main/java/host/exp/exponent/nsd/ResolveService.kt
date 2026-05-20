package host.exp.exponent.nsd

import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.os.Build
import androidx.annotation.RequiresApi
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

@Suppress("DEPRECATION")
internal suspend fun NsdManager.resolveServiceCoroutine(
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
internal fun NsdManager.serviceInfoFlow(
  serviceInfo: NsdServiceInfo
): Flow<NsdServiceInfo> = callbackFlow {
  val manager = this@serviceInfoFlow

  val callback = object : NsdManager.ServiceInfoCallback {
    override fun onServiceInfoCallbackRegistrationFailed(errorCode: Int) {
      close(
        RuntimeException("Service info callback registration failed: errorCode=$errorCode")
      )
    }

    override fun onServiceUpdated(resolvedInfo: NsdServiceInfo) {
      trySend(resolvedInfo)
    }

    // The service lost is going to be handled by the NSD service.
    override fun onServiceLost() = Unit
    override fun onServiceInfoCallbackUnregistered() = Unit
  }

  manager.registerServiceInfoCallback(serviceInfo, { it.run() }, callback)

  awaitClose {
    runCatching {
      manager.unregisterServiceInfoCallback(callback)
    }
  }
}
