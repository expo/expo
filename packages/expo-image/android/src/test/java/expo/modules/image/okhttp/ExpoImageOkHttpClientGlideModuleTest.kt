package expo.modules.image.okhttp

import android.webkit.CookieManager
import com.bumptech.glide.Glide
import com.bumptech.glide.Priority
import com.bumptech.glide.Registry
import com.bumptech.glide.load.Options
import com.bumptech.glide.load.data.DataFetcher
import com.bumptech.glide.load.model.GlideUrl
import com.bumptech.glide.load.model.LazyHeaders
import com.facebook.react.modules.network.OkHttpClientProvider
import com.facebook.react.modules.network.ReactCookieJarContainer
import okhttp3.Authenticator
import okhttp3.Cache
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import okhttp3.OkHttpClient
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import okhttp3.mockwebserver.RecordedRequest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config
import java.io.InputStream
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class ExpoImageOkHttpClientGlideModuleTest {
  @get:Rule
  val server = MockWebServer()

  @After
  fun tearDown() {
    OkHttpClientProvider.setOkHttpClientFactory(null)
    CookieManager.getInstance().removeAllCookies(null)
    Glide.tearDown()
  }

  @Test
  fun sharesCookiesAndRetainsFactorySettings() {
    val url = server.url("/image")
    val cookieManager = CookieManager.getInstance()
    cookieManager.setCookie(url.toString(), "session=fetch; HttpOnly; Path=/")
    OkHttpClientProvider.setOkHttpClientFactory {
      OkHttpClientProvider.createClientBuilder()
        .addInterceptor { chain ->
          chain.proceed(chain.request().newBuilder().header("X-Factory", "retained").build())
        }
        .build()
    }

    val request = fetch(GlideUrl(url.toString()))

    assertEquals("session=fetch", request.getHeader("Cookie"))
    assertEquals("retained", request.getHeader("X-Factory"))
    assertTrue(cookieManager.getCookie(url.toString()).contains("image_cookie=received"))

    val customCookie = Cookie.Builder().name("factory_cookie").value("configured").hostOnlyDomain(url.host).build()
    val customJar = object : CookieJar {
      override fun loadForRequest(url: HttpUrl) = listOf(customCookie)
      override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) = Unit
    }
    OkHttpClientProvider.setOkHttpClientFactory {
      OkHttpClient.Builder().cookieJar(customJar).build()
    }

    assertEquals("factory_cookie=configured", fetch(GlideUrl(url.toString())).getHeader("Cookie"))
  }

  @Test
  fun sharesCookiesWithProgressRequests() {
    val url = server.url("/image")
    val cookieManager = CookieManager.getInstance()
    cookieManager.setCookie(url.toString(), "session=fetch; HttpOnly; Path=/")

    val request = fetch(GlideUrlWrapper(GlideUrl(url.toString())))

    assertEquals("session=fetch", request.getHeader("Cookie"))
    assertTrue(cookieManager.getCookie(url.toString()).contains("image_cookie=received"))
  }

  @Test
  fun skipsInvalidSharedCookies() {
    val url = server.url("/image")
    val cookieManager = CookieManager.getInstance()
    cookieManager.setCookie(url.toString(), "session=valid; Path=/")
    cookieManager.setCookie(url.toString(), "display_name=Jörg; Path=/")

    assertEquals("session=valid", fetch(GlideUrl(url.toString())).getHeader("Cookie"))
  }

  @Test
  fun preservesExplicitCookieHeaders() {
    val url = server.url("/image")
    CookieManager.getInstance().setCookie(url.toString(), "session=shared; Path=/")
    val headers = LazyHeaders.Builder().addHeader("cOoKiE", "session=explicit").build()
    val glideUrl = GlideUrl(url.toString(), headers)

    for (model in listOf(glideUrl, GlideUrlWrapper(glideUrl))) {
      assertEquals("session=explicit", fetch(model).getHeader("Cookie"))
    }
  }

  @Test
  fun preservesConfiguredCookieContainers() {
    val url = server.url("/image")
    CookieManager.getInstance().setCookie(url.toString(), "session=shared; Path=/")
    val customCookie = Cookie.Builder().name("factory_cookie").value("configured").hostOnlyDomain(url.host).build()
    val savedCookies = mutableListOf<Cookie>()
    val customJar = object : CookieJar {
      override fun loadForRequest(url: HttpUrl) = listOf(customCookie)
      override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        savedCookies.addAll(cookies)
      }
    }
    val container = ReactCookieJarContainer().apply { setCookieJar(customJar) }
    OkHttpClientProvider.setOkHttpClientFactory {
      OkHttpClientProvider.createClientBuilder().cookieJar(container).build()
    }

    assertEquals("factory_cookie=configured", fetch(GlideUrl(url.toString())).getHeader("Cookie"))
    assertTrue(savedCookies.any { it.name == "image_cookie" && it.value == "received" })
    assertEquals(listOf(customCookie), container.loadForRequest(url))
  }

  @Test
  fun retainsCookieContainersWithoutRequestCookies() {
    val url = server.url("/image")
    CookieManager.getInstance().setCookie(url.toString(), "session=shared; Path=/")
    val savedCookies = mutableListOf<Cookie>()
    val customJar = object : CookieJar {
      override fun loadForRequest(url: HttpUrl) = emptyList<Cookie>()
      override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        savedCookies.addAll(cookies)
      }
    }
    val container = ReactCookieJarContainer().apply { setCookieJar(customJar) }
    OkHttpClientProvider.setOkHttpClientFactory {
      OkHttpClientProvider.createClientBuilder().cookieJar(container).build()
    }

    assertEquals("session=shared", fetch(GlideUrl(url.toString())).getHeader("Cookie"))
    assertTrue(savedCookies.any { it.name == "image_cookie" && it.value == "received" })
  }

  @Test
  fun variesCachedResponsesBySharedCookies() {
    val url = server.url("/image")
    val cacheDirectory = RuntimeEnvironment.getApplication().cacheDir.resolve("image-cookies")
    Cache(cacheDirectory, 1024L * 1024).use { cache ->
      OkHttpClientProvider.setOkHttpClientFactory {
        OkHttpClientProvider.createClientBuilder().cache(cache).build()
      }
      server.enqueue(
        MockResponse().setBody("anonymous image")
          .addHeader("Cache-Control", "max-age=3600")
          .addHeader("Vary", "Cookie")
      )
      assertNull(fetch(GlideUrl(url.toString())).getHeader("Cookie"))
      CookieManager.getInstance().setCookie(url.toString(), "session=authenticated; Path=/")

      assertEquals("session=authenticated", fetch(GlideUrl(url.toString())).getHeader("Cookie"))
    }
  }

  @Test
  fun preservesAuthenticatorCookieHeaders() {
    val url = server.url("/image")
    CookieManager.getInstance().setCookie(url.toString(), "session=shared; Path=/")
    val authenticator = Authenticator { _, response ->
      response.request.newBuilder().header("Cookie", "session=authenticated").build()
    }
    for (status in listOf(401, 407)) {
      OkHttpClientProvider.setOkHttpClientFactory {
        val builder = OkHttpClientProvider.createClientBuilder()
        if (status == 401) {
          builder.authenticator(authenticator)
        } else {
          builder.proxy(server.toProxyAddress()).proxyAuthenticator(authenticator)
        }
        builder.build()
      }
      server.enqueue(MockResponse().setResponseCode(status))

      val initialRequest = fetch(GlideUrl(url.toString()))
      val retry = requireNotNull(server.takeRequest(10, TimeUnit.SECONDS))

      assertTrue(initialRequest.getHeader("Cookie").orEmpty().contains("session=shared"))
      assertEquals("session=authenticated", retry.getHeader("Cookie"))
    }
  }

  @Test
  fun reusesConnectionsAcrossImageLoaders() {
    val url = GlideUrl(server.url("/image").toString())
    for (authenticator in listOf(Authenticator.NONE, Authenticator { _, _ -> null })) {
      val client = OkHttpClientProvider.createClientBuilder().proxyAuthenticator(authenticator).build()
      OkHttpClientProvider.setOkHttpClientFactory { client }

      assertEquals(0, fetch(url).sequenceNumber)
      assertEquals(1, fetch(GlideUrlWrapper(url)).sequenceNumber)
    }
  }

  private fun fetch(model: Any): RecordedRequest {
    server.enqueue(MockResponse().setBody("image").addHeader("Set-Cookie", "image_cookie=received; Path=/"))
    val context = RuntimeEnvironment.getApplication()
    val registry = Registry()
    ExpoImageOkHttpClientGlideModule().registerComponents(context, Glide.get(context), registry)
    val fetcher = requireNotNull(registry.getModelLoaders(model).first().buildLoadData(model, 0, 0, Options())).fetcher
    val completed = CountDownLatch(1)
    var failure: Exception? = null

    try {
      fetcher.loadData(
        Priority.NORMAL,
        object : DataFetcher.DataCallback<Any> {
          override fun onDataReady(data: Any?) {
            if (data is InputStream) {
              data.close()
            }
            completed.countDown()
          }

          override fun onLoadFailed(error: Exception) {
            failure = error
            completed.countDown()
          }
        }
      )
      assertTrue("Image request did not complete", completed.await(10, TimeUnit.SECONDS))
      assertNull("Image request failed", failure)
      return requireNotNull(server.takeRequest(10, TimeUnit.SECONDS))
    } finally {
      fetcher.cleanup()
    }
  }
}
