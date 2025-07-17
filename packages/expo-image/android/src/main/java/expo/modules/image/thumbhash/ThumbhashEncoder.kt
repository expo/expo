package expo.modules.image.thumbhash

import android.graphics.Bitmap
import android.graphics.Color

// ThumbHash Java implementation (converted to kotlin) thanks to @evanw https://github.com/evanw/thumbhash
object ThumbhashEncoder {
  /**
   * Encodes an RGBA image to a ThumbHash. RGB should not be premultiplied by A.
   * @param bitmap The bitmap to generate the ThumbHash from.
   * @return The ThumbHash as a byte array.
   */
  fun encode(bitmap: Bitmap): ByteArray {
    // Encoding an image larger than 100x100 is slow with no benefit
    val resizedBitmap = resizeKeepingAspectRatio(bitmap, 100)
    val w = resizedBitmap.width
    val h = resizedBitmap.height

    val pixels = IntArray(w * h)
    resizedBitmap.getPixels(pixels, 0, w, 0, 0, w, h)

    var avg_r = 0f
    var avg_g = 0f
    var avg_b = 0f
    var avg_a = 0f
    var i = 0
    while (i < w * h) {
      val alpha = Color.alpha(pixels[i]) / 255.0f
      avg_r += alpha / 255.0f * Color.red(pixels[i])
      avg_g += alpha / 255.0f * Color.green(pixels[i])
      avg_b += alpha / 255.0f * Color.blue(pixels[i])
      avg_a += alpha
      i++
    }

    if (avg_a > 0) {
      avg_r /= avg_a
      avg_g /= avg_a
      avg_b /= avg_a
    }
    val hasAlpha = avg_a < w * h
    val l_limit = if (hasAlpha) 5 else 7 // Use fewer luminance bits if there's alpha
    val lx = Math.max(1, Math.round((l_limit * w).toFloat() / Math.max(w, h).toFloat()))
    val ly = Math.max(1, Math.round((l_limit * h).toFloat() / Math.max(w, h).toFloat()))
    val l = FloatArray(w * h) // luminance
    val p = FloatArray(w * h) // yellow - blue
    val q = FloatArray(w * h) // red - green
    val a = FloatArray(w * h) // alpha

    // Convert the image from RGBA to LPQA (composite atop the average color)
    i = 0
    while (i < w * h) {
      val alpha = (Color.alpha(pixels[i]) and 255) / 255.0f
      val r = avg_r * (1.0f - alpha) + alpha / 255.0f * Color.red(pixels[i])
      val g = avg_g * (1.0f - alpha) + alpha / 255.0f * Color.green(pixels[i])
      val b = avg_b * (1.0f - alpha) + alpha / 255.0f * Color.blue(pixels[i])
      l[i] = (r + g + b) / 3.0f
      p[i] = (r + g) / 2.0f - b
      q[i] = r - g
      a[i] = alpha
      i++
    }

    // Encode using the DCT into DC (constant) and normalized AC (varying) terms
    val l_channel = Channel(Math.max(3, lx), Math.max(3, ly)).encode(w, h, l)
    val p_channel = Channel(3, 3).encode(w, h, p)
    val q_channel = Channel(3, 3).encode(w, h, q)
    val a_channel = if (hasAlpha) Channel(5, 5).encode(w, h, a) else null

    // Write the constants
    val isLandscape = w > h
    val header24 = (
      Math.round(63.0f * l_channel.dc)
        or (Math.round(31.5f + 31.5f * p_channel.dc) shl 6)
        or (Math.round(31.5f + 31.5f * q_channel.dc) shl 12)
        or (Math.round(31.0f * l_channel.scale) shl 18)
        or if (hasAlpha) 1 shl 23 else 0
      )
    val header16 = (
      (if (isLandscape) ly else lx)
        or (Math.round(63.0f * p_channel.scale) shl 3)
        or (Math.round(63.0f * q_channel.scale) shl 9)
        or if (isLandscape) 1 shl 15 else 0
      )
    val ac_start = if (hasAlpha) 6 else 5
    val ac_count = (
      l_channel.ac.size + p_channel.ac.size + q_channel.ac.size +
        if (hasAlpha) a_channel!!.ac.size else 0
      )
    val hash = ByteArray(ac_start + (ac_count + 1) / 2)
    hash[0] = header24.toByte()
    hash[1] = (header24 shr 8).toByte()
    hash[2] = (header24 shr 16).toByte()
    hash[3] = header16.toByte()
    hash[4] = (header16 shr 8).toByte()
    if (hasAlpha) {
      hash[5] = (
        Math.round(15.0f * a_channel!!.dc)
          or (Math.round(15.0f * a_channel.scale) shl 4)
        ).toByte()
    }

    // Write the varying factors
    var ac_index = 0
    ac_index = l_channel.writeTo(hash, ac_start, ac_index)
    ac_index = p_channel.writeTo(hash, ac_start, ac_index)
    ac_index = q_channel.writeTo(hash, ac_start, ac_index)
    if (hasAlpha) a_channel!!.writeTo(hash, ac_start, ac_index)

    return hash
  }

  private fun resizeKeepingAspectRatio(bitmap: Bitmap, maxSize: Int): Bitmap {
    val width = bitmap.width
    val height = bitmap.height
    val ratio = width.toFloat() / height.toFloat()

    val newWidth: Int
    val newHeight: Int

    if (ratio > 1) {
      newWidth = maxSize
      newHeight = (maxSize / ratio).toInt()
    } else {
      newHeight = maxSize
      newWidth = (maxSize * ratio).toInt()
    }

    return Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
  }

  private class Channel(var nx: Int, var ny: Int) {
    var dc = 0f
    var ac: FloatArray
    var scale = 0f

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

    fun encode(w: Int, h: Int, channel: FloatArray): Channel {
      var n = 0
      val fx = FloatArray(w)
      for (cy in 0 until ny) {
        var cx = 0
        while (cx * ny < nx * (ny - cy)) {
          var f = 0f
          for (x in 0 until w) fx[x] = Math.cos(Math.PI / w * cx * (x + 0.5f)).toFloat()
          for (y in 0 until h) {
            val fy = Math.cos(Math.PI / h * cy * (y + 0.5f)).toFloat()
            for (x in 0 until w) f += channel[x + y * w] * fx[x] * fy
          }
          f /= (w * h).toFloat()
          if (cx > 0 || cy > 0) {
            ac[n++] = f
            scale = Math.max(scale, Math.abs(f))
          } else {
            dc = f
          }
          cx++
        }
      }
      if (scale > 0) for (i in ac.indices) ac[i] = 0.5f + 0.5f / scale * ac[i]
      return this
    }

    fun writeTo(hash: ByteArray, start: Int, index: Int): Int {
      var currentIndex = index
      for (v in ac) {
        hash[start + (currentIndex shr 1)] = (hash[start + (currentIndex shr 1)].toInt() or (Math.round(15.0f * v) shl (currentIndex and 1 shl 2))).toByte()
        currentIndex++
      }
      return currentIndex
    }
  }
}
