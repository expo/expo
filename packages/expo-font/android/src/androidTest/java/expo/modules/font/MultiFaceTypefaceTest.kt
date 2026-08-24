package expo.modules.font

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.fonts.Font
import android.graphics.fonts.FontFamily
import android.graphics.fonts.FontStyle
import android.os.Build
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.SdkSuppress
import expo.modules.kotlin.exception.CodedException
import java.io.File
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.channels.FileChannel
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Assume.assumeTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Exercises FontLoaderModule.buildMultiFaceTypeface's FontFamily construction against real font data.
 *
 * `DroidSans.ttf` and `DroidSans-Bold.ttf` on this image are both symlinks to
 * `Roboto-Regular.ttf` and byte-for-byte identical, so they can't produce visibly different
 * glyphs, and there's no separate static italic file. These tests instead instance
 * `Roboto-Regular.ttf`'s own `wght` axis at two weights to get faces whose glyphs actually
 * differ, then build the same FontFamily FontLoaderModule builds.
 *
 * Needs `connectedAndroidTest` against a device or emulator; not run by `et native-unit-tests`.
 */
@RunWith(AndroidJUnit4::class)
@SdkSuppress(minSdkVersion = Build.VERSION_CODES.Q)
class MultiFaceTypefaceTest {
  private val regularFile = File("/system/fonts/DroidSans.ttf")
  private val variableFile = File("/system/fonts/Roboto-Regular.ttf")

  private var lightWeight = 0
  private var heavyWeight = 0

  @Before
  fun findWeightAxis() {
    assumeTrue(Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q)
    assumeTrue(regularFile.exists() && variableFile.exists())

    val axis = FontVariationAxes.readWeightAxis(map(variableFile))
    assumeTrue("Roboto-Regular.ttf has no `wght` axis on this device", axis != null)

    val weights = FontVariationAxes.weightsFor(axis!!)
    assumeTrue(
      "Roboto-Regular.ttf's axis is too narrow to compare weights: $axis",
      weights.size >= 2
    )

    lightWeight = weights.first()
    heavyWeight = weights.last()
  }

  private fun map(file: File): ByteBuffer =
    FileInputStream(file).use { it.channel.map(FileChannel.MapMode.READ_ONLY, 0, it.channel.size()) }

  private fun instanceAt(weight: Int, slant: Int = FontStyle.FONT_SLANT_UPRIGHT): Font =
    Font.Builder(map(variableFile))
      .setFontVariationSettings("'wght' $weight")
      .setWeight(weight)
      .setSlant(slant)
      .build()

  // Renders a whole word, not a single glyph: a lone glyph can round a weight difference away
  // once antialiasing rounds it to the same pixels.
  private fun inkedPixelCount(typeface: Typeface, weight: Int, italic: Boolean): Int {
    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      this.typeface = Typeface.create(typeface, weight, italic)
      textSize = HEIGHT * 0.6f
      color = Color.BLACK
    }
    val bitmap = Bitmap.createBitmap(WIDTH, HEIGHT, Bitmap.Config.ARGB_8888)
    Canvas(bitmap).apply {
      drawColor(Color.WHITE)
      drawText(SAMPLE, 8f, HEIGHT * 0.75f, paint)
    }

    val pixels = IntArray(WIDTH * HEIGHT)
    bitmap.getPixels(pixels, 0, WIDTH, 0, 0, WIDTH, HEIGHT)
    bitmap.recycle()
    return pixels.count { Color.red(it) < INK_THRESHOLD }
  }

  @Test
  fun heavierFaceRendersMoreInkAtItsDeclaredWeight() {
    val family = FontFamily.Builder(instanceAt(lightWeight)).addFont(instanceAt(heavyWeight)).build()
    val typeface = VariableTypefaces.wrapWithSystemFallback(family)

    val lightInk = inkedPixelCount(typeface, lightWeight, italic = false)
    val heavyInk = inkedPixelCount(typeface, heavyWeight, italic = false)

    assertTrue(
      "Expected requesting weight $heavyWeight to draw more ink than weight $lightWeight " +
        "($heavyInk vs $lightInk)",
      heavyInk > lightInk
    )
  }

  // No static italic file exists on this image, so this test proves selection via `setSlant`,
  // not rendered slant.
  @Test
  fun setSlantLabelDrivesSelectionEvenWithNoItalicFile() {
    val declaredWeight = heavyWeight
    val labeledItalic = Font.Builder(map(variableFile))
      .setFontVariationSettings("'wght' $lightWeight")
      .setWeight(declaredWeight)
      .setSlant(FontStyle.FONT_SLANT_ITALIC)
      .build()
    val labeledUpright = Font.Builder(map(variableFile))
      .setFontVariationSettings("'wght' $heavyWeight")
      .setWeight(declaredWeight)
      .setSlant(FontStyle.FONT_SLANT_UPRIGHT)
      .build()
    val family = FontFamily.Builder(labeledItalic).addFont(labeledUpright).build()
    val typeface = VariableTypefaces.wrapWithSystemFallback(family)

    val italicInk = inkedPixelCount(typeface, declaredWeight, italic = true)
    val uprightInk = inkedPixelCount(typeface, declaredWeight, italic = false)

    assertTrue(
      "Expected italic=true to select the face labeled italic (instanced at $lightWeight, " +
        "less ink), not the face labeled upright (instanced at $heavyWeight, more ink): " +
        "italic=$italicInk ink, upright=$uprightInk ink",
      italicInk < uprightInk
    )
  }

  @Test
  fun duplicateResolvedWeightAndSlantThrowsCodedException() {
    val first = Font.Builder(regularFile).build()
    val second = Font.Builder(regularFile).build()

    fun resolvedFace(localUri: String, font: Font) = FontFaceRecord(
      localUri = localUri,
      weight = font.style.weight,
      style = if (font.style.slant == FontStyle.FONT_SLANT_ITALIC) "italic" else "normal"
    )

    val resolvedFaces = listOf(
      resolvedFace("$regularFile#1", first),
      resolvedFace("$regularFile#2", second)
    )

    try {
      FontFamilyFaces.assertNoDuplicateFaces("MultiFaceTypefaceTest", resolvedFaces)
      fail("Expected a CodedException for two faces that resolve to the same weight and slant")
    } catch (e: CodedException) {
      // expected
    }
  }

  private companion object {
    const val SAMPLE = "Hamburgefonstiv"
    const val WIDTH = 720
    const val HEIGHT = 120

    // Comfortably below the antialiased edges, so a heavier stem counts and a fringe doesn't.
    const val INK_THRESHOLD = 128
  }
}
