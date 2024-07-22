package expo.modules.camera.legacy.tasks

import android.os.Bundle

interface PictureSavedDelegate {
  fun onPictureSaved(response: Bundle)
}
