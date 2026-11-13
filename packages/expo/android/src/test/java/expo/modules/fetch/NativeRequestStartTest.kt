// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.fetch

import com.google.common.truth.Truth.assertThat
import com.google.common.util.concurrent.MoreExecutors
import expo.modules.kotlin.AppContext
import io.mockk.mockk
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import okhttp3.Dispatcher
import okhttp3.OkHttpClient
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.IOException
import java.net.URL

@RunWith(RobolectricTestRunner::class)
class NativeRequestStartTest {
  @Test
  fun `a failure that OkHttp reports before start returns is not dropped`() {
    val appContext = mockk<AppContext>(relaxed = true)
    val response = NativeResponse(appContext, CoroutineScope(Job() + Dispatchers.Unconfined))
    val request = NativeRequest(appContext, response)
    // A direct executor runs the call inside `enqueue`, so the callback always wins the race.
    val client = OkHttpClient.Builder()
      .dispatcher(Dispatcher(MoreExecutors.newDirectExecutorService()))
      .addInterceptor { throw IOException("Connection refused") }
      .build()

    request.start(client, URL("http://127.0.0.1/"), NativeRequestInit(), null)

    assertThat(response.error).isInstanceOf(IOException::class.java)
  }
}
