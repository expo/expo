package expo.modules.callbacktest

import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.jni.Callback
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import kotlinx.coroutines.delay

class ProgressRecord : Record {
  @Field var percent: Double = 0.0
  @Field var stage: String = ""
}

enum class DownloadStage(val value: String) : Enumerable {
  STARTED("started"),
  DOWNLOADING("downloading"),
  COMPLETED("completed")
}

class CallbackTestModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("CallbackTest")

    Function("callWithInt") { callback: Callback ->
      callback(42)
    }

    Function("callMultiple") { callback: Callback ->
      callback(1)
      callback(2)
      callback(3)
    }

    Function("callWithRecord") { callback: Callback ->
      val progress = ProgressRecord().apply {
        percent = 0.75
        stage = "downloading"
      }
      callback(progress)
    }

    Function("callWithEnum") { callback: Callback ->
      callback(DownloadStage.COMPLETED)
    }

    Function("greetWithCallback") { name: String, callback: Callback ->
      callback("Hello, $name!")
    }

    AsyncFunction("simulateDownload") Coroutine { callback: Callback ->
      for (step in 0..4) {
        val percent = step / 4.0
        val stage = when (step) {
          0 -> "started"
          4 -> "completed"
          else -> "downloading"
        }
        callback(mapOf("stage" to stage, "percent" to percent))
        if (step < 4) delay(300)
      }
    }

    // Two Callback parameters in one function.
    Function("callWithTwoCallbacks") { onProgress: Callback, onDone: Callback ->
      onProgress(0.5)
      onDone("finished")
    }

    // A nullable Callback: NullableTypeConverter wrapping CallbackTypeConverter.
    Function("callOptional") { callback: Callback? ->
      callback?.invoke("provided")
    }

    Function("callWithArray") { callback: Callback ->
      callback(listOf(1, 2, 3))
    }

    Function("callWithMap") { callback: Callback ->
      callback(mapOf("name" to "expo", "version" to 58))
    }

    Function("callWithMixedArgs") { callback: Callback ->
      callback(true, 3.14, "text", listOf("a", "b"))
    }

    Function("callWithNull") { callback: Callback ->
      callback(null)
    }

    // A callback and a promise result in the same call.
    AsyncFunction("simulateDownloadWithResult") Coroutine { callback: Callback ->
      for (percent in listOf(0.0, 0.5, 1.0)) {
        callback(percent)
        if (percent < 1.0) delay(200)
      }
      "complete"
    }

    Function("callFromBackgroundThread") { callback: Callback ->
      Thread {
        callback("from background")
      }.start()
    }

    Function("callWithRecordAndCallback") { options: ProgressRecord, callback: Callback ->
      callback(options)
    }
  }
}
