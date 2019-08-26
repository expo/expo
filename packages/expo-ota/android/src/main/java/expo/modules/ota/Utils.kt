package expo.modules.ota

import java.lang.IllegalStateException

internal fun throwUninitializedExpoOtaError() {
    throw IllegalStateException("Have you forgotten to call ExpoOTA.init() in your MainApplication?")
}