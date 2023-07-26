// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.kotlin.devtools.cdp

import expo.modules.kotlin.devtools.ExpoNetworkInspectOkHttpNetworkInterceptor
import expo.modules.kotlin.devtools.toSingleMap
import okio.Buffer
import org.json.JSONObject
import java.math.BigDecimal

//region Types

typealias Headers = Map<String, String>
typealias MonotonicTime = BigDecimal
typealias RequestId = String
typealias TimeSinceEpoch = BigDecimal

enum class ResourceType(val value: String) {
  IMAGE("Image"),
  MEDIA("Media"),
  FONT("Font"),
  SCRIPT("Script"),
  FETCH("Fetch"),
  OTHER("Other");

  companion object {
    fun fromMimeType(mimeType: String): ResourceType = when {
      mimeType.startsWith("image/") -> IMAGE
      mimeType.startsWith("audio") || mimeType.startsWith("video") -> MEDIA
      mimeType.startsWith("font") -> FONT
      else -> OTHER
    }
  }
}

interface JsonSerializable {
  fun toJSONObject(): JSONObject
}

data class ConnectTiming(val requestTime: MonotonicTime) : JsonSerializable {
  override fun toJSONObject(): JSONObject {
    return JSONObject().apply {
      put("requestTime", requestTime)
    }
  }
}

data class Request(
  val url: String,
  val method: String,
  val headers: Headers,
  val postData: String?
) : JsonSerializable {
  constructor(request: okhttp3.Request) : this(
    url = request.url.toString(),
    method = request.method,
    headers = request.headers.toSingleMap(),
    postData = request.body?.let {
      if (it.contentLength() < ExpoNetworkInspectOkHttpNetworkInterceptor.MAX_BODY_SIZE) {
        val buffer = Buffer()
        it.writeTo(buffer)
        return@let buffer.readUtf8(buffer.size.coerceAtMost(ExpoNetworkInspectOkHttpNetworkInterceptor.MAX_BODY_SIZE))
      } else return@let null
    }
  )

  override fun toJSONObject(): JSONObject {
    return JSONObject().apply {
      put("url", url)
      put("method", method)
      put("headers", JSONObject(headers))
      postData?.let {
        put("postData", postData)
      }
    }
  }
}

data class Response(
  val url: String,
  val status: Int,
  val statusText: String,
  val headers: Headers,
  val mimeType: String,
  val encodedDataLength: Long
) : JsonSerializable {
  constructor(response: okhttp3.Response) : this(
    url = response.request.url.toString(),
    status = response.code,
    statusText = response.message,
    headers = response.headers.toSingleMap(),
    mimeType = response.header("Content-Type", "") ?: "",
    encodedDataLength = response.body?.contentLength() ?: 0,
  )

  override fun toJSONObject(): JSONObject {
    return JSONObject().apply {
      put("url", url)
      put("status", status)
      put("statusText", statusText)
      put("headers", JSONObject(headers))
      put("mimeType", mimeType)
      put("encodedDataLength", encodedDataLength)
    }
  }
}

//endregion Types

//region Events

data class RequestWillBeSentParams(
  val requestId: RequestId,
  val loaderId: String = "",
  val documentURL: String = "mobile",
  val request: Request,
  val timestamp: MonotonicTime,
  val wallTime: TimeSinceEpoch,
  val initiator: Map<String, String> = mapOf("type" to "script"),
  val redirectHasExtraInfo: Boolean,
  val redirectResponse: Response?,
  val referrerPolicy: String = "no-referrer",
  val type: ResourceType,
) : JsonSerializable {
  constructor(now: BigDecimal, requestId: RequestId, request: okhttp3.Request, redirectResponse: okhttp3.Response?) : this(
    requestId = requestId,
    request = Request(request),
    timestamp = now,
    wallTime = now,
    redirectHasExtraInfo = redirectResponse != null,
    redirectResponse = redirectResponse?.let { Response(it) },
    type = ResourceType.OTHER,
  )

  override fun toJSONObject(): JSONObject {
    return JSONObject().apply {
      put("requestId", requestId)
      put("loaderId", loaderId)
      put("documentURL", documentURL)
      put("request", request.toJSONObject())
      put("timestamp", timestamp)
      put("wallTime", wallTime)
      put("initiator", JSONObject(initiator))
      put("redirectHasExtraInfo", redirectHasExtraInfo)
      redirectResponse?.let {
        put("redirectResponse", it.toJSONObject())
      }
      put("referrerPolicy", referrerPolicy)
      put("type", type.value)
    }
  }
}

data class RequestWillBeSentExtraInfoParams(
  val requestId: RequestId,
  val associatedCookies: Map<String, String> = emptyMap(),
  val headers: Headers,
  val connectTiming: ConnectTiming,
) : JsonSerializable {
  constructor(now: BigDecimal, requestId: RequestId, request: okhttp3.Request) : this(
    requestId = requestId,
    headers = request.headers.toSingleMap(),
    connectTiming = ConnectTiming(now),
  )

  override fun toJSONObject(): JSONObject {
    return JSONObject().apply {
      put("requestId", requestId)
      put("associatedCookies", JSONObject(associatedCookies))
      put("headers", JSONObject(headers))
      put("connectTiming", connectTiming.toJSONObject())
    }
  }
}

data class ResponseReceivedParams(
  val requestId: RequestId,
  val loaderId: String = "",
  val timestamp: MonotonicTime,
  val type: ResourceType,
  val response: Response,
  val hasExtraInfo: Boolean = false,
) : JsonSerializable {
  constructor(now: BigDecimal, requestId: RequestId, request: okhttp3.Request, okhttpResponse: okhttp3.Response) : this(
    requestId = requestId,
    timestamp = now,
    type = ResourceType.fromMimeType(okhttpResponse.header("Content-Type", "") ?: ""),
    response = Response(okhttpResponse),
  )

  override fun toJSONObject(): JSONObject {
    return JSONObject().apply {
      put("requestId", requestId)
      put("loaderId", loaderId)
      put("timestamp", timestamp)
      put("type", type.value)
      put("response", response.toJSONObject())
      put("hasExtraInfo", hasExtraInfo)
    }
  }
}

data class LoadingFinishedParams(
  val requestId: RequestId,
  val timestamp: MonotonicTime,
  val encodedDataLength: Long,
) : JsonSerializable {
  constructor(now: BigDecimal, requestId: RequestId, request: okhttp3.Request, response: okhttp3.Response) : this(
    requestId = requestId,
    timestamp = now,
    encodedDataLength = response.body?.contentLength() ?: 0,
  )

  override fun toJSONObject(): JSONObject {
    return JSONObject().apply {
      put("requestId", requestId)
      put("timestamp", timestamp)
      put("encodedDataLength", encodedDataLength)
    }
  }
}

data class ExpoReceivedResponseBodyParams(
  val requestId: RequestId,
  var body: String,
  var base64Encoded: Boolean,
) : JsonSerializable {
  constructor(now: BigDecimal, requestId: RequestId, request: okhttp3.Request, response: okhttp3.Response) : this(
    requestId = requestId,
    body = "",
    base64Encoded = false,
  ) {
    val rawBody = response.peekBody(ExpoNetworkInspectOkHttpNetworkInterceptor.MAX_BODY_SIZE)
    val contentType = rawBody.contentType()
    val isText = contentType?.type == "text" || (contentType?.type == "application" && contentType.subtype == "json")
    val bodyString = if (isText) rawBody.string() else rawBody.source().readByteString().base64()

    this.body = bodyString
    this.base64Encoded = !isText
  }
  override fun toJSONObject(): JSONObject {
    return JSONObject().apply {
      put("requestId", requestId)
      put("body", body)
      put("base64Encoded", base64Encoded)
    }
  }
}

//endregion Events

typealias EventParams = JsonSerializable

data class Event(
  val method: String,
  val params: EventParams
) {
  fun toJson(): String {
    return JSONObject().apply {
      put("method", method)
      put("params", params.toJSONObject())
    }.toString()
  }
}
