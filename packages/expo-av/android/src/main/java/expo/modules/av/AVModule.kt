package expo.modules.av

import android.Manifest
import expo.modules.core.arguments.ReadableArguments
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private class AVManagerModuleNotFound : CodedException(message = "AVManagerInterface not found")

private typealias KotlinPromise = expo.modules.kotlin.Promise
private typealias LegacyPromise = expo.modules.core.Promise

class AVModule : Module() {
  private val _avManager by lazy { appContext.legacyModule<AVManagerInterface>() }
  private val avManager: AVManagerInterface
    get() = _avManager ?: throw AVManagerModuleNotFound()

  override fun definition() = ModuleDefinition {
    Name("ExponentAV")

    Events(
      "didUpdatePlaybackStatus",
      "ExponentAV.onError",
      "Expo.Recording.recorderUnloaded"
    )

    AsyncFunction("setAudioIsEnabled") { value: Boolean ->
      avManager.setAudioIsEnabled(value)
    }

    AsyncFunction("setAudioMode") { map: ReadableArguments ->
      avManager.setAudioMode(map)
    }

    AsyncFunction("loadForSound") { source: ReadableArguments, status: ReadableArguments, promise: KotlinPromise ->
      avManager.loadForSound(source, status, promise.toLegacyPromise())
    }

    AsyncFunction("unloadForSound") { key: Int, promise: KotlinPromise ->
      avManager.unloadForSound(key, promise.toLegacyPromise())
    }

    AsyncFunction("setStatusForSound") { key: Int, status: ReadableArguments, promise: KotlinPromise ->
      avManager.setStatusForSound(key, status, promise.toLegacyPromise())
    }

    AsyncFunction("replaySound") { key: Int, status: ReadableArguments, promise: KotlinPromise ->
      avManager.replaySound(key, status, promise.toLegacyPromise())
    }

    AsyncFunction("getStatusForSound") { key: Int, promise: KotlinPromise ->
      avManager.getStatusForSound(key, promise.toLegacyPromise())
    }

    AsyncFunction("loadForVideo") { tag: Int, source: ReadableArguments?, status: ReadableArguments?, promise: KotlinPromise ->
      avManager.loadForVideo(tag, source, status, promise.toLegacyPromise())
    }

    AsyncFunction("unloadForVideo") { tag: Int, promise: KotlinPromise ->
      avManager.unloadForVideo(tag, promise.toLegacyPromise())
    }

    AsyncFunction("setStatusForVideo") { tag: Int, status: ReadableArguments, promise: KotlinPromise ->
      avManager.setStatusForVideo(tag, status, promise.toLegacyPromise())
    }

    AsyncFunction("replayVideo") { tag: Int, status: ReadableArguments, promise: KotlinPromise ->
      avManager.replayVideo(tag, status, promise.toLegacyPromise())
    }

    AsyncFunction("getStatusForVideo") { tag: Int, promise: KotlinPromise ->
      avManager.getStatusForVideo(tag, promise.toLegacyPromise())
    }

    AsyncFunction("prepareAudioRecorder") { options: ReadableArguments, promise: KotlinPromise ->
      avManager.prepareAudioRecorder(options, promise.toLegacyPromise())
    }

    AsyncFunction("getAvailableInputs") { promise: KotlinPromise ->
      avManager.getAvailableInputs(promise.toLegacyPromise())
    }

    AsyncFunction("getCurrentInput") { promise: KotlinPromise ->
      avManager.getCurrentInput(promise.toLegacyPromise())
    }

    AsyncFunction("setInput") { uid: String, promise: KotlinPromise ->
      avManager.setInput(uid, promise.toLegacyPromise())
    }

    AsyncFunction("startAudioRecording") { promise: KotlinPromise ->
      avManager.startAudioRecording(promise.toLegacyPromise())
    }

    AsyncFunction("pauseAudioRecording") { promise: KotlinPromise ->
      avManager.pauseAudioRecording(promise.toLegacyPromise())
    }

    AsyncFunction("stopAudioRecording") { promise: KotlinPromise ->
      avManager.stopAudioRecording(promise.toLegacyPromise())
    }

    AsyncFunction("getAudioRecordingStatus") { promise: KotlinPromise ->
      avManager.getAudioRecordingStatus(promise.toLegacyPromise())
    }

    AsyncFunction("unloadAudioRecorder") { promise: KotlinPromise ->
      avManager.unloadAudioRecorder(promise.toLegacyPromise())
    }

    AsyncFunction("requestPermissionsAsync") { promise: KotlinPromise ->
      Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.RECORD_AUDIO)
    }

    AsyncFunction("getPermissionsAsync") { promise: KotlinPromise ->
      Permissions.getPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.RECORD_AUDIO)
    }
  }
}

private fun KotlinPromise.toLegacyPromise(): LegacyPromise {
  val newPromise = this
  return object : LegacyPromise {
    override fun resolve(value: Any?) {
      newPromise.resolve(value)
    }

    override fun reject(c: String?, m: String?, e: Throwable?) {
      newPromise.reject(c ?: "unknown", m, e)
    }
  }
}
