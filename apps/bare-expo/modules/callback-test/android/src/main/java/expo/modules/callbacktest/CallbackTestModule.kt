package expo.modules.callbacktest

import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.jni.JSCallback
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

    Function("callWithInt") { callback: JSCallback ->
      callback(42)
    }

    Function("callMultiple") { callback: JSCallback ->
      callback(1)
      callback(2)
      callback(3)
    }

    Function("callWithRecord") { callback: JSCallback ->
      val progress = ProgressRecord().apply {
        percent = 0.75
        stage = "downloading"
      }
      callback(progress)
    }

    Function("callWithEnum") { callback: JSCallback ->
      callback(DownloadStage.COMPLETED)
    }

    AsyncFunction("simulateDownload") Coroutine { callback: JSCallback ->
      for (i in 0..4) {
        val percent = i / 4.0
        val stage = when (i) {
          0 -> "started"
          4 -> "completed"
          else -> "downloading"
        }
        callback(mapOf("stage" to stage, "percent" to percent))
        if (i < 4) delay(300)
      }
    }

    Function("greetWithCallback") { name: String, callback: JSCallback ->
      callback("Hello, $name!")
    }
  }
}
