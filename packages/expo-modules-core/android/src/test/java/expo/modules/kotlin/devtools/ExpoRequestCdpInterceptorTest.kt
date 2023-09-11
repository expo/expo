// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.kotlin.devtools

import com.google.common.truth.Truth
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import org.junit.Test

class MockCdpInterceptorDelegate : ExpoRequestCdpInterceptor.Delegate {
  internal val events = ArrayList<String>()

  override fun dispatch(event: String) {
    events.add(event)
  }
}

@OptIn(ExperimentalCoroutinesApi::class)
class ExpoRequestCdpInterceptorTest {
  private val mockDelegate = MockCdpInterceptorDelegate()
  private val client = OkHttpClient.Builder()
    .addInterceptor(ExpoNetworkInspectOkHttpAppInterceptor())
    .addNetworkInterceptor(ExpoNetworkInspectOkHttpNetworkInterceptor())
    .build()

  init {
    ExpoRequestCdpInterceptor.coroutineScope = CoroutineScope(UnconfinedTestDispatcher())
    ExpoRequestCdpInterceptor.setDelegate(mockDelegate)
  }

  @Test
  fun `simple json data`() {
    client.newCall(Request.Builder().url("https://raw.githubusercontent.com/expo/expo/main/package.json").build()).execute()
    Truth.assertThat(mockDelegate.events.size).isEqualTo(5)

    // Network.requestWillBeSent
    var json = JSONObject(mockDelegate.events[0])
    var method = json.getString("method")
    var params = json.getJSONObject("params")
    val request = params.getJSONObject("request")
    val requestId = params.getString("requestId")
    Truth.assertThat(method).isEqualTo("Network.requestWillBeSent")
    Truth.assertThat(request.getString("url")).isEqualTo("https://raw.githubusercontent.com/expo/expo/main/package.json")

    // Network.requestWillBeSentExtraInfo
    json = JSONObject(mockDelegate.events[1])
    method = json.getString("method")
    params = json.getJSONObject("params")
    Truth.assertThat(method).isEqualTo("Network.requestWillBeSentExtraInfo")
    Truth.assertThat(params.getString("requestId")).isEqualTo(requestId)

    // Network.responseReceived
    json = JSONObject(mockDelegate.events[2])
    method = json.getString("method")
    params = json.getJSONObject("params")
    val response = params.getJSONObject("response")
    Truth.assertThat(method).isEqualTo("Network.responseReceived")
    Truth.assertThat(params.getString("requestId")).isEqualTo(requestId)
    Truth.assertThat(response.getInt("status")).isEqualTo(200)
    Truth.assertThat(response.getJSONObject("headers").length()).isGreaterThan(0)
    Truth.assertThat(response.getLong("encodedDataLength")).isGreaterThan(0)

    // Expo(Network.receivedResponseBody)
    json = JSONObject(mockDelegate.events[3])
    method = json.getString("method")
    params = json.getJSONObject("params")
    Truth.assertThat(method).isEqualTo("Expo(Network.receivedResponseBody)")
    Truth.assertThat(params.getString("requestId")).isEqualTo(requestId)
    Truth.assertThat(params.getString("body")).isNotEmpty()
    Truth.assertThat(params.getBoolean("base64Encoded")).isFalse()

    // Network.loadingFinished
    json = JSONObject(mockDelegate.events[4])
    method = json.getString("method")
    params = json.getJSONObject("params")
    Truth.assertThat(method).isEqualTo("Network.loadingFinished")
    Truth.assertThat(params.getString("requestId")).isEqualTo(requestId)
    Truth.assertThat(params.getLong("encodedDataLength")).isGreaterThan(0)
  }

  @Test
  fun `http 302 redirection`() {
    client.newCall(Request.Builder().url("https://github.com/expo.png").build()).execute()
    Truth.assertThat(mockDelegate.events.size).isEqualTo(7)

    // Network.requestWillBeSent
    var json = JSONObject(mockDelegate.events[0])
    var method = json.getString("method")
    var params = json.getJSONObject("params")
    var request = params.getJSONObject("request")
    val requestId = params.getString("requestId")
    Truth.assertThat(method).isEqualTo("Network.requestWillBeSent")
    Truth.assertThat(request.getString("url")).isEqualTo("https://github.com/expo.png")

    // Network.requestWillBeSentExtraInfo

    // Network.requestWillBeSent
    json = JSONObject(mockDelegate.events[2])
    method = json.getString("method")
    params = json.getJSONObject("params")
    request = params.getJSONObject("request")
    val redirectResponse = params.getJSONObject("redirectResponse")
    Truth.assertThat(method).isEqualTo("Network.requestWillBeSent")
    Truth.assertThat(params.getString("requestId")).isEqualTo(requestId)
    Truth.assertThat(request.getString("url")).startsWith("https://avatars.githubusercontent.com")
    Truth.assertThat(redirectResponse.length()).isGreaterThan(0)
    Truth.assertThat(redirectResponse.getInt("status")).isEqualTo(302)
    Truth.assertThat(redirectResponse.getJSONObject("headers").length()).isGreaterThan(0)

    // Network.requestWillBeSentExtraInfo

    // Network.responseReceived
    json = JSONObject(mockDelegate.events[4])
    method = json.getString("method")
    params = json.getJSONObject("params")
    val response = params.getJSONObject("response")
    Truth.assertThat(method).isEqualTo("Network.responseReceived")
    Truth.assertThat(params.getString("requestId")).isEqualTo(requestId)
    Truth.assertThat(response.getInt("status")).isEqualTo(200)
    Truth.assertThat(response.getString("mimeType")).isEqualTo("image/png")
    Truth.assertThat(response.getJSONObject("headers").length()).isGreaterThan(0)

    // Expo(Network.receivedResponseBody)
    json = JSONObject(mockDelegate.events[5])
    method = json.getString("method")
    params = json.getJSONObject("params")
    Truth.assertThat(method).isEqualTo("Expo(Network.receivedResponseBody)")
    Truth.assertThat(params.getString("requestId")).isEqualTo(requestId)
    Truth.assertThat(params.getString("body")).isNotEmpty()
    Truth.assertThat(params.getBoolean("base64Encoded")).isTrue()

    // Network.loadingFinished
  }

  @Test
  fun `respect image mimeType to CDP event`() {
    client.newCall(Request.Builder().url("https://avatars.githubusercontent.com/u/12504344").build()).execute()
    Truth.assertThat(mockDelegate.events.size).isEqualTo(5)

    // Network.requestWillBeSent
    // Network.requestWillBeSentExtraInfo

    // Network.responseReceived
    val json = JSONObject(mockDelegate.events[2])
    val method = json.getString("method")
    val params = json.getJSONObject("params")
    val response = params.getJSONObject("response")
    Truth.assertThat(method).isEqualTo("Network.responseReceived")
    Truth.assertThat(response.getInt("status")).isEqualTo(200)
    Truth.assertThat(response.getString("mimeType")).isEqualTo("image/png")
    Truth.assertThat(params.getString("type")).isEqualTo("Image")
  }

  @Test
  fun `skip 'receivedResponseBody' when response size exceeding 1MB limit`() {
    client.newCall(Request.Builder().url("https://raw.githubusercontent.com/expo/expo/main/apps/native-component-list/assets/videos/ace.mp4").build()).execute()
    Truth.assertThat(mockDelegate.events.size).isEqualTo(4)

    var json = JSONObject(mockDelegate.events[0])
    Truth.assertThat(json.getString("method")).isEqualTo("Network.requestWillBeSent")

    json = JSONObject(mockDelegate.events[1])
    Truth.assertThat(json.getString("method")).isEqualTo("Network.requestWillBeSentExtraInfo")

    json = JSONObject(mockDelegate.events[2])
    Truth.assertThat(json.getString("method")).isEqualTo("Network.responseReceived")

    json = JSONObject(mockDelegate.events[3])
    Truth.assertThat(json.getString("method")).isEqualTo("Network.loadingFinished")
  }
}
