package expo.modules.image

import com.bumptech.glide.load.Key
import com.bumptech.glide.load.engine.cache.DiskCache
import com.bumptech.glide.load.engine.cache.DiskLruCacheWrapper
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File
import java.security.MessageDigest

private object TestKey : Key {
  override fun updateDiskCacheKey(messageDigest: MessageDigest) {
    messageDigest.update("https://example.com/image.webp".toByteArray())
  }
}

private fun writerOf(content: String) = DiskCache.Writer { file ->
  file.writeText(content)
  true
}

@RunWith(RobolectricTestRunner::class)
class ExpoImageDiskCacheTest {
  private lateinit var directory: File

  @Before
  fun setUp() {
    directory = File.createTempFile("expo-image-disk-cache", "").apply {
      delete()
      mkdirs()
    }
  }

  @After
  fun tearDown() {
    directory.deleteRecursively()
  }

  @Test
  fun `writes over an entry that already exists`() {
    val cache = ExpoImageDiskCache(DiskLruCacheWrapper.create(directory, 1024L * 1024L))

    cache.put(TestKey, writerOf("an html error page"))
    cache.put(TestKey, writerOf("the real image"))

    assertEquals("the real image", cache.get(TestKey)?.readText())
  }
}
