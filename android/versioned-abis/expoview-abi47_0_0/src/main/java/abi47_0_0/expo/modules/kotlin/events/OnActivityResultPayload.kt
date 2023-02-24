package abi47_0_0.expo.modules.kotlin.events

import android.content.Intent

/**
 * Payload for the `onActivityResult` event.
 */
data class OnActivityResultPayload(val requestCode: Int, val resultCode: Int, val data: Intent?)
