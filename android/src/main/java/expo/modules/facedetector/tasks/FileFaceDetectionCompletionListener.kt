package expo.modules.facedetector.tasks

import android.os.Bundle

interface FileFaceDetectionCompletionListener {
  fun resolve(result: Bundle)
  fun reject(tag: String, message: String)
}
