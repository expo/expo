package expo.modules.image.thumbhash

import android.graphics.Bitmap
import android.graphics.Color

// ThumbHash Java implementation (converted to kotlin) thanks to @evanw https://github.com/evanw/thumbhash
object ThumbhashDecoder {
  /**
   * Decodes a ThumbHash to an RGBA image. RGB is not be premultiplied by A.
   *
   * @param hash The bytes of the ThumbHash.
   * @return The width, height, and pixels of the rendered placeholder image.
   */
  fun thumbHashToRGBA(hash: ByteArray): Image {
    // Read the constants
    val header24 = hash[0].toInt() and 255 or (hash[1].toInt() and 255 shl 8) or (hash[2].toInt() and 255 shl 16)
    val header16 = hash[3].toInt() and 255 or (hash[4].toInt() and 255 shl 8)
    val l_dc = (header24 and 63).toFloat() / 63.0f
    val p_dc = (header24 shr 6 and 63).toFloat() / 31.5f - 1.0f
    val q_dc = (header24 shr 12 and 63).toFloat() / 31.5f - 1.0f
    val l_scale = (header24 shr 18 and 31).toFloat() / 31.0f
    val hasAlpha = header24 shr 23 != 0
    val p_scale = (header16 shr 3 and 63).toFloat() / 63.0f
    val q_scale = (header16 shr 9 and 63).toFloat() / 63.0f
    val isLandscape = header16 shr 15 != 0
    val lx = Math.max(3, if (isLandscape) if (hasAlpha) 5 else 7 else header16 and 7)
    val ly = Math.max(3, if (isLandscape) header16 and 7 else if (hasAlpha) 5 else 7)
    val a_dc = if (hasAlpha) (hash[5].toInt() and 15).toFloat() / 15.0f else 1.0f
    val a_scale = (hash[5].toInt() shr 4 and 15).toFloat() / 15.0f

    // Read the varying factors (boost saturation by 1.25x to compensate for quantization)
    val ac_start = if (hasAlpha) 6 else 5
    var ac_index = 0
    val l_channel = Channel(lx, ly)
    val p_channel = Channel(3, 3)
    val q_channel = Channel(3, 3)
    var a_channel: Channel? = null
    ac_index = l_channel.decode(hash, ac_start, ac_index, l_scale)
    ac_index = p_channel.decode(hash, ac_start, ac_index, p_scale * 1.25f)
    ac_index = q_channel.decode(hash, ac_start, ac_index, q_scale * 1.25f)
    if (hasAlpha) {
      a_channel = Channel(5, 5)
      a_channel.decode(hash, ac_start, ac_index, a_scale)
    }
    val l_ac = l_channel.ac
    val p_ac = p_channel.ac
    val q_ac = q_channel.ac
    val a_ac = if (hasAlpha) a_channel!!.ac else null

    // Decode using the DCT into RGB
    val ratio = thumbHashToApproximateAspectRatio(hash)
    val w = Math.round(if (ratio > 1.0f) 32.0f else 32.0f * ratio)
    val h = Math.round(if (ratio > 1.0f) 32.0f / ratio else 32.0f)
    val rgba = ByteArray(w * h * 4)
    val cx_stop = Math.max(lx, if (hasAlpha) 5 else 3)
    val cy_stop = Math.max(ly, if (hasAlpha) 5 else 3)
    val fx = FloatArray(cx_stop)
    val fy = FloatArray(cy_stop)
    var y = 0
    var i = 0
    while (y < h) {
      var x = 0
      while (x < w) {
        var l = l_dc
        var p = p_dc
        var q = q_dc
        var a = a_dc

        // Precompute the coefficients
        for (cx in 0 until cx_stop) fx[cx] = Math.cos(Math.PI / w * (x + 0.5f) * cx).toFloat()
        for (cy in 0 until cy_stop) fy[cy] = Math.cos(Math.PI / h * (y + 0.5f) * cy).toFloat()

        // Decode L
        run {
          var cy = 0
          var j = 0
          while (cy < ly) {
            val fy2 = fy[cy] * 2.0f
            var cx = if (cy > 0) 0 else 1
            while (cx * ly < lx * (ly - cy)) {
              l += l_ac[j] * fx[cx] * fy2
              cx++
              j++
            }
            cy++
          }
        }

        // Decode P and Q
        var cy = 0
        var j = 0
        while (cy < 3) {
          val fy2 = fy[cy] * 2.0f
          var cx = if (cy > 0) 0 else 1
          while (cx < 3 - cy) {
            val f = fx[cx] * fy2
            p += p_ac[j] * f
            q += q_ac[j] * f
            cx++
            j++
          }
          cy++
        }

        // Decode A
        if (hasAlpha) {
          var cyAlpha = 0
          var k = 0
          while (cyAlpha < 5) {
            val fy2 = fy[cyAlpha] * 2.0f
            var cx = if (cyAlpha > 0) 0 else 1
            while (cx < 5 - cyAlpha) {
              a += a_ac!![k] * fx[cx] * fy2
              cx++
              k++
            }
            cyAlpha++
          }
        }

        // Convert to RGB
        val b = l - 2.0f / 3.0f * p
        val r = (3.0f * l - b + q) / 2.0f
        val g = r - q
        rgba[i] = Math.max(0, Math.round(255.0f * Math.min(1f, r))).toByte()
        rgba[i + 1] = Math.max(0, Math.round(255.0f * Math.min(1f, g))).toByte()
        rgba[i + 2] = Math.max(0, Math.round(255.0f * Math.min(1f, b))).toByte()
        rgba[i + 3] = Math.max(0, Math.round(255.0f * Math.min(1f, a))).toByte()
        x++
        i += 4
      }
      y++
    }
    return Image(w, h, rgba)
  }

  /**
   * Converts a ThumbHash into a Bitmap image
   */
  fun thumbHashToBitmap(hash: ByteArray): Bitmap {
    val thumbhashImage = thumbHashToRGBA(hash)
    // TODO: @behenate it should be possible to replace all of the code below with
    // with BitmapFactory.decodeByteArray but it always returns null when using thumbhashImage.rgba
    val imageArray = IntArray(thumbhashImage.width * thumbhashImage.height)
    val thumbhashImageInt = thumbhashImage.rgba.map { it.toUByte().toInt() }
    for (i in thumbhashImageInt.indices step 4) {
      imageArray[i / 4] = Color.argb(
        thumbhashImageInt[i + 3],
        thumbhashImageInt[i],
        thumbhashImageInt[i + 1],
        thumbhashImageInt[i + 2]
      )
    }
    return Bitmap.createBitmap(imageArray, thumbhashImage.width, thumbhashImage.height, Bitmap.Config.ARGB_8888)
  }

  /**
   * Extracts the average color from a ThumbHash. RGB is not be premultiplied by A.
   *
   * @param hash The bytes of the ThumbHash.
   * @return The RGBA values for the average color. Each value ranges from 0 to 1.
   */
  fun thumbHashToAverageRGBA(hash: ByteArray): RGBA {
    val header = hash[0].toInt() and 255 or (hash[1].toInt() and 255 shl 8) or (hash[2].toInt() and 255 shl 16)
    val l = (header and 63).toFloat() / 63.0f
    val p = (header shr 6 and 63).toFloat() / 31.5f - 1.0f
    val q = (header shr 12 and 63).toFloat() / 31.5f - 1.0f
    val hasAlpha = header shr 23 != 0
    val a = if (hasAlpha) (hash[5].toInt() and 15).toFloat() / 15.0f else 1.0f
    val b = l - 2.0f / 3.0f * p
    val r = (3.0f * l - b + q) / 2.0f
    val g = r - q
    return RGBA(
      Math.max(0f, Math.min(1f, r)),
      Math.max(0f, Math.min(1f, g)),
      Math.max(0f, Math.min(1f, b)),
      a
    )
  }

  /**
   * Extracts the approximate aspect ratio of the original image.
   *
   * @param hash The bytes of the ThumbHash.
   * @return The approximate aspect ratio (i.e. width / height).
   */
  fun thumbHashToApproximateAspectRatio(hash: ByteArray): Float {
    val header = hash[3]
    val hasAlpha = hash[2].toInt() and 0x80 != 0
    val isLandscape = hash[4].toInt() and 0x80 != 0
    val lx = if (isLandscape) if (hasAlpha) 5 else 7 else header.toInt() and 7
    val ly = if (isLandscape) header.toInt() and 7 else if (hasAlpha) 5 else 7
    return lx.toFloat() / ly.toFloat()
  }

  class Image(var width: Int, var height: Int, var rgba: ByteArray)
  class RGBA(var r: Float, var g: Float, var b: Float, var a: Float)
  private class Channel(nx: Int, ny: Int) {
    var ac: FloatArray
    init {
      var n = 0
      for (cy in 0 until ny) {
        var cx = if (cy > 0) 0 else 1
        while (cx * ny < nx * (ny - cy)) {
          n++
          cx++
        }
      }
      ac = FloatArray(n)
    }

    fun decode(hash: ByteArray, start: Int, index: Int, scale: Float): Int {
      var currentIndex = index
      for (i in ac.indices) {
        val data = hash[start + (currentIndex shr 1)].toInt() shr (currentIndex and 1 shl 2)
        ac[i] = ((data and 15).toFloat() / 7.5f - 1.0f) * scale
        currentIndex++
      }
      return currentIndex
    }
  }
}
