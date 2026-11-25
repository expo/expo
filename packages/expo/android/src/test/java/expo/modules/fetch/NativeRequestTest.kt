// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.fetch

import com.google.common.truth.Truth.assertThat
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import org.junit.Test

class NativeRequestTest {
  private val jsonMediaType = "application/json".toMediaTypeOrNull()

  @Test
  fun `null body on a method requiring a body produces an empty body, not a null byte`() {
    val body = buildRequestBody("POST", null, jsonMediaType)
    assertThat(body).isNotNull()
    // Regression test for https://github.com/expo/expo/issues/46668:
    // OkHttp requires a non-null body for POST/PUT/PATCH, but the body must be
    // empty (Content-Length: 0) rather than a single 0x00 byte (Content-Length: 1).
    assertThat(body!!.contentLength()).isEqualTo(0L)
  }

  @Test
  fun `null body on a method not requiring a body produces no body`() {
    assertThat(buildRequestBody("GET", null, jsonMediaType)).isNull()
  }

  @Test
  fun `a provided body is preserved`() {
    val body = buildRequestBody("POST", "hello".toByteArray(), jsonMediaType)
    assertThat(body).isNotNull()
    assertThat(body!!.contentLength()).isEqualTo(5L)
  }
}
