package expo.modules.av

import android.Manifest
import expo.modules.core.arguments.ReadableArguments
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private class AVManagerModuleNotFound : CodedException(message = "AVManagerInterface not found")

class AVModule : Module() {
  private val _avManager by lazy { appContext.legacyModule<AVManagerInterface>() }
  private val avManager: AVManagerInterface
    get() = _avManager ?: throw AVManagerModuleNotFound()

  override fun definition() = ModuleDefinition {
    Name("ExponentAV")

    AsyncFunction("setAudioIsEnabled") { value: Boolean ->
      avManager.setAudioIsEnabled(value)
    }

    AsyncFunction("setAudioMode") { map: ReadableArguments ->
      avManager.setAudioMode(map)
    }

    AsyncFunction("loadForSound") { source: ReadableArguments, status: ReadableArguments, promise: expo.modules.kotlin.Promise ->
      avManager.loadForSound(source, status, promise.toLegacyPromise())
    }

    AsyncFunction("unloadForSound") { key: Int, promise: expo.modules.kotlin.Promise ->
      avManager.unloadForSound(key, promise.toLegacyPromise())
    }

    AsyncFunction("setStatusForSound") { key: Int, status: ReadableArguments, promise: expo.modules.kotlin.Promise ->
      avManager.setStatusForSound(key, status, promise.toLegacyPromise())
    }

    AsyncFunction("replaySound") { key: Int, status: ReadableArguments, promise: expo.modules.kotlin.Promise ->
      avManager.replaySound(key, status, promise.toLegacyPromise())
    }

    AsyncFunction("getStatusForSound") { key: Int, promise: expo.modules.kotlin.Promise ->
      avManager.getStatusForSound(key, promise.toLegacyPromise())
    }

    AsyncFunction("loadForVideo") { tag: Int, source: ReadableArguments?, status: ReadableArguments?, promise: expo.modules.kotlin.Promise ->
      avManager.loadForVideo(tag, source, status, promise.toLegacyPromise())
    }

    AsyncFunction("unloadForVideo") { tag: Int, promise: expo.modules.kotlin.Promise ->
      avManager.unloadForVideo(tag, promise.toLegacyPromise())
    }

    AsyncFunction("setStatusForVideo") { tag: Int, status: ReadableArguments, promise: expo.modules.kotlin.Promise ->
      avManager.setStatusForVideo(tag, status, promise.toLegacyPromise())
    }

    AsyncFunction("replayVideo") { tag: Int, status: ReadableArguments, promise: expo.modules.kotlin.Promise ->
      avManager.replayVideo(tag, status, promise.toLegacyPromise())
    }

    AsyncFunction("getStatusForVideo") { tag: Int, promise: expo.modules.kotlin.Promise ->
      avManager.getStatusForVideo(tag, promise.toLegacyPromise())
    }

    AsyncFunction("prepareAudioRecorder") { options: ReadableArguments, promise: expo.modules.kotlin.Promise ->
      avManager.prepareAudioRecorder(options, promise.toLegacyPromise())
    }

    AsyncFunction("getAvailableInputs") { promise: expo.modules.kotlin.Promise ->
      avManager.getAvailableInputs(promise.toLegacyPromise())
    }

    AsyncFunction("getCurrentInput") { promise: expo.modules.kotlin.Promise ->
      avManager.getCurrentInput(promise.toLegacyPromise())
    }

    AsyncFunction("setInput") { uid: String, promise: expo.modules.kotlin.Promise ->
      avManager.setInput(uid, promise.toLegacyPromise())
    }

    AsyncFunction("startAudioRecording") { promise: expo.modules.kotlin.Promise ->
      avManager.startAudioRecording(promise.toLegacyPromise())
    }

    AsyncFunction("pauseAudioRecording") { promise: expo.modules.kotlin.Promise ->
      avManager.pauseAudioRecording(promise.toLegacyPromise())
    }

    AsyncFunction("stopAudioRecording") { promise: expo.modules.kotlin.Promise ->
      avManager.stopAudioRecording(promise.toLegacyPromise())
    }

    AsyncFunction("getAudioRecordingStatus") { promise: expo.modules.kotlin.Promise ->
      avManager.getAudioRecordingStatus(promise.toLegacyPromise())
    }

    AsyncFunction("unloadAudioRecorder") { promise: expo.modules.kotlin.Promise ->
      avManager.unloadAudioRecorder(promise.toLegacyPromise())
    }

    AsyncFunction("requestPermissionsAsync") { promise: expo.modules.kotlin.Promise ->
      Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.RECORD_AUDIO)
    }

    AsyncFunction("getPermissionsAsync") { promise: expo.modules.kotlin.Promise ->
      Permissions.getPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.RECORD_AUDIO)
    }
  }
}

private fun expo.modules.kotlin.Promise.toLegacyPromise(): expo.modules.core.Promise {
  val newPromise = this
  return object : expo.modules.core.Promise {
    override fun resolve(value: Any) {
      newPromise.resolve(value)
    }

    override fun reject(c: String, m: String, e: Throwable) {
      newPromise.reject(c, m, e)
    }
  }
}
