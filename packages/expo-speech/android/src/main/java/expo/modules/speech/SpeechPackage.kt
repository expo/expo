package expo.modules.speech

import android.content.Context
import org.unimodules.core.BasePackage

class SpeechPackage : BasePackage() {
  override fun createExportedModules(context: Context) = listOf(SpeechModule(context))
}
