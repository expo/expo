package expo.modules.integrity

import android.app.Activity
import android.os.Bundle
import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.google.android.play.core.integrity.StandardIntegrityManager.PrepareIntegrityTokenRequest
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class IntegrityLifecycleListener : ReactActivityLifecycleListener {
  override fun onCreate(activity: Activity?, savedInstanceState: Bundle?) {
    super.onCreate(activity, savedInstanceState)
    val integrityManager = IntegrityManagerFactory.createStandard(activity?.applicationContext)

    val cloudProjectNumber = BuildConfig.GOOGLE_CLOUD_NUMBER

    integrityManager.prepareIntegrityToken(
      PrepareIntegrityTokenRequest.builder()
        .setCloudProjectNumber(cloudProjectNumber.toLong())
        .build()
    ).addOnSuccessListener {
      IntegrityProvider.tokenProvider = it
    }.addOnFailureListener {
      IntegrityProvider.tokenException = it
    }
  }
}