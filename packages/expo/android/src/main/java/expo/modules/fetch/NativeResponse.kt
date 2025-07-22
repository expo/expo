// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.fetch

import android.util.Log
import expo.modules.core.logging.localizedMessageWithCauseLocalizedMessage
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedObject
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.Call
import okhttp3.Callback
import okhttp3.Response
import okio.BufferedSource
import java.io.IOException

internal class NativeResponse(appContext: AppContext, private val coroutineScope: CoroutineScope) :
  SharedObject(appContext), Callback {
  val sink = ResponseSink()
  private var state: ResponseState = ResponseState.INITIALIZED
    get() = synchronized(this) { field }
    private set(value) {
      synchronized(this) {
        field = value
      }
      coroutineScope.launch {
        this@NativeResponse.stateChangeOnceListeners.removeAll { it(value) }
      }
    }
  private val stateChangeOnceListeners: MutableList<StateChangeListener> = mutableListOf()

  var responseInit: NativeResponseInit? = null
    private set
  var error: Exception? = null
    private set
  var redirectMode: NativeRequestRedirect? = null

  val bodyUsed: Boolean
    get() = this.sink.bodyUsed

  override fun deallocate() {
    this.sink.finalize()
    super.deallocate()
  }

  fun onStarted() {
    if (isInvalidState(ResponseState.INITIALIZED)) {
      return
    }
    state = ResponseState.STARTED
  }

  fun startStreaming(): ByteArray? {
    if (isInvalidState(ResponseState.RESPONSE_RECEIVED, ResponseState.BODY_COMPLETED)) {
      return null
    }
    if (state == ResponseState.RESPONSE_RECEIVED) {
      state = ResponseState.BODY_STREAMING_STARTED
      val queuedData = this.sink.finalize()
      emit("didReceiveResponseData", queuedData)
    } else if (state == ResponseState.BODY_COMPLETED) {
      val queuedData = this.sink.finalize()
      return queuedData
    }
    return null
  }

  fun cancelStreaming() {
    if (isInvalidState(ResponseState.BODY_STREAMING_STARTED)) {
      return
    }
    state = ResponseState.BODY_STREAMING_CANCELED
  }

  fun emitRequestCanceled() {
    val error = FetchRequestCanceledException()
    this.error = error
    if (state == ResponseState.BODY_STREAMING_STARTED) {
      emit("didFailWithError", error.localizedMessageWithCauseLocalizedMessage())
    }
    state = ResponseState.ERROR_RECEIVED
  }

  fun waitForStates(states: List<ResponseState>, callback: (ResponseState) -> Unit) {
    if (states.contains(state)) {
      callback(state)
      return
    }
    stateChangeOnceListeners.add { newState ->
      if (states.contains(newState)) {
        callback(newState)
        return@add true
      }
      return@add false
    }
  }

  //region Callback implementations

  override fun onFailure(call: Call, e: IOException) {
    // Canceled request should be handled by emitRequestCanceled
    if (e.message == "Canceled") {
      return
    }

    if (isInvalidState(
        ResponseState.STARTED,
        ResponseState.RESPONSE_RECEIVED,
        ResponseState.BODY_STREAMING_STARTED,
        ResponseState.BODY_STREAMING_CANCELED
      )
    ) {
      return
    }

    if (state == ResponseState.BODY_STREAMING_STARTED) {
      emit("didFailWithError", e.localizedMessageWithCauseLocalizedMessage())
    }
    error = e
    state = ResponseState.ERROR_RECEIVED
    emit("readyForJSFinalization")
  }

  override fun onResponse(call: Call, response: Response) {
    if (response.isRedirect && redirectMode == NativeRequestRedirect.ERROR) {
      response.close()
      val error = FetchRedirectException()
      this.error = error
      if (state == ResponseState.BODY_STREAMING_STARTED) {
        emit("didFailWithError", error.localizedMessageWithCauseLocalizedMessage())
      }
      state = ResponseState.ERROR_RECEIVED
      emit("readyForJSFinalization")
      return
    }

    responseInit = createResponseInit(response)
    state = ResponseState.RESPONSE_RECEIVED

    coroutineScope.launch(Dispatchers.IO) {
      val stream = response.body?.source() ?: return@launch
      pumpResponseBodyStream(stream)
      response.close()

      if (this@NativeResponse.state == ResponseState.BODY_STREAMING_STARTED) {
        emit("didComplete")
      }
      this@NativeResponse.state = ResponseState.BODY_COMPLETED
      emit("readyForJSFinalization")
    }
  }

  //endregion Callback implementations

  //region Internals

  private fun isInvalidState(vararg validStates: ResponseState): Boolean {
    if (validStates.contains(state)) {
      return false
    }

    val validStatesString = validStates.joinToString(",") { it.intValue.toString() }
    Log.w(TAG, "Invalid state - currentState[${state.intValue}] validStates[$validStatesString]")
    return true
  }

  private fun createResponseInit(response: Response): NativeResponseInit {
    val status = response.code
    val statusText = response.message
    val headers = response.headers.map { header ->
      header.first to header.second
    }
    val redirected = response.isRedirect
    val url = response.request.url.toString()
    return NativeResponseInit(
      headers = headers,
      status = status,
      statusText = statusText,
      url = url,
      redirected = redirected
    )
  }

  private fun pumpResponseBodyStream(stream: BufferedSource) {
    try {
      while (!stream.exhausted()) {
        if (isInvalidState(
            ResponseState.RESPONSE_RECEIVED,
            ResponseState.BODY_STREAMING_STARTED,
            ResponseState.BODY_STREAMING_CANCELED
          )
        ) {
          break
        }
        if (state == ResponseState.RESPONSE_RECEIVED) {
          sink.appendBufferBody(stream.buffer.readByteArray())
        } else if (state == ResponseState.BODY_STREAMING_STARTED) {
          emit("didReceiveResponseData", stream.buffer.readByteArray())
        } else {
          break
        }
      }
    } catch (e: IOException) {
      this.error = e
      if (state == ResponseState.BODY_STREAMING_STARTED) {
        emit("didFailWithError", e.localizedMessageWithCauseLocalizedMessage())
      }
      state = ResponseState.ERROR_RECEIVED
    }
  }

  //endregion Internals

  companion object {
    private val TAG = NativeResponse::class.java.simpleName
  }
}

private typealias StateChangeListener = (ResponseState) -> Boolean
