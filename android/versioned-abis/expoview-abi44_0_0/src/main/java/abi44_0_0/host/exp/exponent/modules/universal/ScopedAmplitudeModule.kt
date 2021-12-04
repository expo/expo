package abi44_0_0.host.exp.exponent.modules.universal

import android.content.Context
import com.amplitude.api.AmplitudeClient
import abi44_0_0.expo.modules.analytics.amplitude.AmplitudeModule
import host.exp.exponent.kernel.ExperienceKey
import java.io.UnsupportedEncodingException

class ScopedAmplitudeModule(context: Context, experienceKey: ExperienceKey) :
  AmplitudeModule(context) {
  private val instanceKeyBase: String = try {
    experienceKey.getUrlEncodedScopeKey()
  } catch (e: UnsupportedEncodingException) {
    experienceKey.scopeKey.hashCode().toString()
  }

  override fun getClient(apiKey: String?): AmplitudeClient {
    // 1. Explicitly not using Amplitude.getInstance(String key) here.
    //    It reuses AmplitudeClient instances, so calling #initialize()
    //    a second time wouldn't reinitialize the client.
    // 2. Scoping by both experienceId and apiKey lets users log events
    //    to more than one app in one experience. Moreover, the underlying
    //    database isn't cleared when initializing, so scoping by:
    //     - only experienceId would mix saved preferences for other Amplitude apps,
    //     - only apiKey would mix saved preferences for one Amplitude app between experiences.
    return AmplitudeClient("$instanceKeyBase#$apiKey")
  }
}
