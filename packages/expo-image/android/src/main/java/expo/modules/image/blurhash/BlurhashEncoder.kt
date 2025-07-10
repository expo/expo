package expo.modules.image.blurhash

import android.graphics.Bitmap
import android.graphics.Color
import kotlin.math.*

/**
 * Rewritten in kotlin from https://github.com/woltapp/blurhash/blob/master/Swift/BlurHashEncode.swift
 */
object BlurhashEncoder {
  fun encode(image: Bitmap, numberOfComponents: Pair<Int, Int>): String {
    val pixels = IntArray(image.width * image.height)
    image.getPixels(pixels, 0, image.width, 0, 0, image.width, image.height)

    val factors = calculateBlurFactors(pixels, image.width, image.height, numberOfComponents)

    val dc = factors.first()
    val ac = factors.drop(1)
    val hashBuilder = StringBuilder()

    encodeFlag(numberOfComponents, hashBuilder)
    val maximumValue = encodeMaximumValue(ac, hashBuilder)
    hashBuilder.append(encode83(encodeDC(dc), 4))
    for (factor in ac) {
      hashBuilder.append(encode83(encodeAC(factor, maximumValue), 2))
    }

    return hashBuilder.toString()
  }

  private fun encodeFlag(numberOfComponents: Pair<Int, Int>, hashBuilder: StringBuilder) {
    val sizeFlag = (numberOfComponents.first - 1) + (numberOfComponents.second - 1) * 9
    hashBuilder.append(encode83(sizeFlag, 1))
  }

  private fun encodeMaximumValue(ac: List<Triple<Float, Float, Float>>, hash: StringBuilder): Float {
    val maximumValue: Float
    if (ac.isNotEmpty()) {
      val actualMaximumValue = ac.maxOf { t -> max(max(abs(t.first), abs(t.second)), abs(t.third)) }
      val quantisedMaximumValue = max(0f, min(82f, floor(actualMaximumValue * 166f - 0.5f))).toInt()
      maximumValue = (quantisedMaximumValue + 1).toFloat() / 166f
      hash.append(encode83(quantisedMaximumValue, 1))
    } else {
      maximumValue = 1f
      hash.append(encode83(0, 1))
    }
    return maximumValue
  }

  private fun calculateBlurFactors(pixels: IntArray, width: Int, height: Int, numberOfComponents: Pair<Int, Int>): List<Triple<Float, Float, Float>> {
    val factors = mutableListOf<Triple<Float, Float, Float>>()
    for (y in 0 until numberOfComponents.second) {
      for (x in 0 until numberOfComponents.first) {
        val normalisation = if (x == 0 && y == 0) 1f else 2f
        val factor = multiplyBasisFunction(pixels, width, height, x, y, normalisation)
        factors.add(factor)
      }
    }
    return factors
  }

  private fun encode83(value: Int, length: Int): String {
    var result = ""
    for (i in 1..length) {
      val digit = (value / 83f.pow((length - i).toFloat())) % 83f
      result += ENCODE_CHARACTERS[digit.toInt()]
    }
    return result
  }

  private const val ENCODE_CHARACTERS =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~"

  private fun encodeDC(value: Triple<Float, Float, Float>): Int {
    val roundedR = BlurhashHelpers.linearTosRGB(value.first)
    val roundedG = BlurhashHelpers.linearTosRGB(value.second)
    val roundedB = BlurhashHelpers.linearTosRGB(value.third)
    return (roundedR shl 16) + (roundedG shl 8) + roundedB
  }

  private fun encodeAC(value: Triple<Float, Float, Float>, maximumValue: Float): Int {
    val quantR = max(0f, min(18f, floor(BlurhashHelpers.signPow(value.first / maximumValue, 0.5f) * 9f + 9.5f)))
    val quantG = max(0f, min(18f, floor(BlurhashHelpers.signPow(value.second / maximumValue, 0.5f) * 9f + 9.5f)))
    val quantB = max(0f, min(18f, floor(BlurhashHelpers.signPow(value.third / maximumValue, 0.5f) * 9f + 9.5f)))

    return (quantR * 19f * 19f + quantG * 19f + quantB).toInt()
  }

  private fun multiplyBasisFunction(pixels: IntArray, width: Int, height: Int, x: Int, y: Int, normalisation: Float): Triple<Float, Float, Float> {
    var r = 0f
    var g = 0f
    var b = 0f

    for (j in 0 until height) {
      for (i in 0 until width) {
        val basis = normalisation * cos(PI.toFloat() * x * i / width) * cos(PI.toFloat() * y * j / height)

        val pixel = pixels[i + j * width]
        val pr = BlurhashHelpers.srgbToLinear(Color.red(pixel))
        val pg = BlurhashHelpers.srgbToLinear(Color.green(pixel))
        val pb = BlurhashHelpers.srgbToLinear(Color.blue(pixel))

        r += basis * pr
        g += basis * pg
        b += basis * pb
      }
    }

    val scale = 1f / (width * height)
    return Triple(r * scale, g * scale, b * scale)
  }
}
