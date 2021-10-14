package expo.modules.camera.tasks

import android.os.Bundle

interface PictureSavedDelegate {
  fun onPictureSaved(response: Bundle)
}
