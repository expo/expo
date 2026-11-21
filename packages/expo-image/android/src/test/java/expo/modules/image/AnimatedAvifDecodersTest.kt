package expo.modules.image

import com.bumptech.glide.load.ImageHeaderParser
import com.bumptech.glide.load.Options
import com.bumptech.glide.load.ResourceDecoder
import com.bumptech.glide.load.engine.Resource
import com.bumptech.glide.load.engine.bitmap_recycle.LruArrayPool
import com.bumptech.glide.load.resource.bitmap.DefaultImageHeaderParser
import com.github.penfeizhou.animation.decode.FrameSeqDecoder
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.ByteArrayInputStream
import java.io.InputStream
import java.nio.ByteBuffer

@RunWith(RobolectricTestRunner::class)
class AnimatedAvifDecodersTest {
  private val parsers = listOf<ImageHeaderParser>(DefaultImageHeaderParser())

  // The `ftyp` boxes of a still AVIF and of an AVIF image sequence, as encoded by libavif.
  private val stillAvif = avifHeader("avif", "mif1", "avif", "miaf")
  private val animatedAvif = avifHeader("avis", "avis", "msf1", "miaf", "MA1B")
  private val jpeg = byteArrayOf(0xFF.toByte(), 0xD8.toByte(), 0xFF.toByte(), 0xE0.toByte()) + ByteArray(32)

  @Test
  fun `byte buffer decoder only handles animated AVIFs`() {
    val decoder = AnimatedAvifByteBufferDecoder(parsers, RecordingDecoder())

    assertTrue(decoder.handles(ByteBuffer.wrap(animatedAvif), Options()))
    assertFalse(decoder.handles(ByteBuffer.wrap(stillAvif), Options()))
    assertFalse(decoder.handles(ByteBuffer.wrap(jpeg), Options()))
  }

  @Test
  fun `stream decoder only handles animated AVIFs and rewinds the stream`() {
    val decoder = AnimatedAvifStreamDecoder(parsers, LruArrayPool(), RecordingDecoder())

    val animated = ByteArrayInputStream(animatedAvif)
    assertTrue(decoder.handles(animated, Options()))
    assertEquals(animatedAvif[0].toInt(), animated.read())

    assertFalse(decoder.handles(ByteArrayInputStream(stillAvif), Options()))
    assertFalse(decoder.handles(ByteArrayInputStream(jpeg), Options()))
  }

  @Test
  fun `decoding is delegated to the animation decoder`() {
    val byteBufferDelegate = RecordingDecoder<ByteBuffer>()
    val streamDelegate = RecordingDecoder<InputStream>()

    AnimatedAvifByteBufferDecoder(parsers, byteBufferDelegate).decode(ByteBuffer.wrap(animatedAvif), 10, 20, Options())
    AnimatedAvifStreamDecoder(parsers, LruArrayPool(), streamDelegate).decode(ByteArrayInputStream(animatedAvif), 10, 20, Options())

    assertEquals(listOf(10 to 20), byteBufferDelegate.decodedSizes)
    assertEquals(listOf(10 to 20), streamDelegate.decodedSizes)
  }

  private fun avifHeader(majorBrand: String, vararg compatibleBrands: String): ByteArray {
    val boxSize = 16 + 4 * compatibleBrands.size
    val box = ByteBuffer.allocate(boxSize)
      .putInt(boxSize)
      .put("ftyp".toByteArray())
      .put(majorBrand.toByteArray())
      .putInt(0)
    compatibleBrands.forEach { box.put(it.toByteArray()) }
    // Followed by the start of the `meta` box, so the parser never runs out of data.
    return box.array() + byteArrayOf(0, 0, 1, 6) + "meta".toByteArray() + ByteArray(32)
  }

  private class RecordingDecoder<T : Any> : ResourceDecoder<T, FrameSeqDecoder<*, *>> {
    val decodedSizes = mutableListOf<Pair<Int, Int>>()

    override fun handles(source: T, options: Options) = true

    override fun decode(source: T, width: Int, height: Int, options: Options): Resource<FrameSeqDecoder<*, *>>? {
      decodedSizes += width to height
      return null
    }
  }
}
