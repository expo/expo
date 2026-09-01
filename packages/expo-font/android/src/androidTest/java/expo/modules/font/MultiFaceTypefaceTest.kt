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
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Exercises the android.graphics.fonts.FontFamily construction that
 * FontLoaderModule.buildMultiFaceTypeface performs, directly against real font data, the same
 * way VariableTypefacesTest exercises VariableTypefaces.
 *
 * The obvious fixture — a static regular file and a static bold file with visibly different
 * glyphs — doesn't exist on this image: `DroidSans.ttf` and `DroidSans-Bold.ttf` are both
 * symlinks to `Roboto-Regular.ttf`, and `adb shell md5sum` confirms all three are byte for byte
 * identical, so requesting either weight from them draws the exact same pixels. There is also no
 * separate static italic file. So these tests instead instance `Roboto-Regular.ttf`'s own `wght`
 * axis at two weights — the technique VariableTypefacesTest already proves reliable on this
 * device — to get two faces whose glyphs actually differ, then build the same two-member
 * FontFamily FontLoaderModule builds and check that `Typeface.create` picks the declared face.
 *
 * Runs through `connectedAndroidTest` against a device or emulator: in CI through the Android
 * Instrumentation Tests workflow, which triggers on changes under `packages/expo-font/android`
 * and boots an API 36 emulator; locally through
 * `et native-unit-tests -p android -t instrumented`. The default `-t local` runs only the JVM
 * tests under src/test and leaves this file out.
 *
 * The fixture is asserted, not assumed. An image without a `wght`-varying
 * /system/fonts/Roboto-Regular.ttf fails these tests instead of skipping them, so a run that
 * cannot build the fixture cannot report green. API level is the one exception: `@SdkSuppress`
 * filters the class below API 29, and the runner reports that as a skip.
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
    assertTrue(
      "These tests need $regularFile and $variableFile, and at least one is missing. The image " +
        "under test does not ship the AOSP font set the fixture is built from. Run them on an " +
        "emulator image that ships it, or point the fixture at font files this image has.",
      regularFile.exists() && variableFile.exists()
    )

    val axis = FontVariationAxes.readWeightAxis(map(variableFile))
    assertNotNull(
      "$variableFile on this image has no `wght` axis. The fixture instances that axis at two " +
        "weights to get faces whose glyphs differ, so without it there is nothing to compare. " +
        "Run these tests on an image whose Roboto-Regular.ttf is a variable font.",
      axis
    )

    val weights = FontVariationAxes.weightsFor(axis!!)
    assertTrue(
      "$variableFile's `wght` axis is too narrow to compare two weights: $axis. The fixture " +
        "needs two distinct weights to render different amounts of ink.",
      weights.size >= 2
    )

    lightWeight = weights.first()
    heavyWeight = weights.last()
  }

  private fun map(file: File): ByteBuffer =
    FileInputStream(file).use { it.channel.map(FileChannel.MapMode.READ_ONLY, 0, it.channel.size()) }

  /**
   * [variableFile] instanced at [weight] on the `wght` axis, with the instance's own weight and
   * [slant] both declared — the same pairing FontLoaderModule.buildMultiFaceTypeface gives a face
   * whose caller declared a weight and a style.
   */
  private fun instanceAt(weight: Int, slant: Int = FontStyle.FONT_SLANT_UPRIGHT): Font =
    Font.Builder(map(variableFile))
      .setFontVariationSettings("'wght' $weight")
      .setWeight(weight)
      .setSlant(slant)
      .build()

  /**
   * The number of pixels that draw darker than [INK_THRESHOLD] when [typeface] renders [SAMPLE]
   * at [weight]/[italic]. A single glyph like "I" can round a weight difference away once
   * antialiasing rounds it to the same pixels, so this renders a whole word, the same way
   * VariableTypefacesTest measures weight.
   */
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

  /**
   * No static italic file exists on this image, so this test proves SELECTION rather than
   * rendered slant. Both faces declare the same weight, so `Typeface.create` can only tell them
   * apart by slant: one face is instanced at [lightWeight] but declares its weight as
   * [heavyWeight] and its slant as italic; the other is instanced at [heavyWeight] and declares
   * the same weight but an upright slant. Asking for italic=true must then draw the lighter
   * instance's ink, and italic=false the heavier one's — proving `setSlant`, not the glyphs
   * themselves (neither is actually slanted), drives the selection.
   */
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

  /**
   * Mirrors the resolved-value check that FontLoaderModule.buildMultiFaceTypeface runs before it
   * calls FontFamily.Builder.addFont: two faces built from the same file with no declared
   * weight/style resolve to the same weight+slant pair, so FontFamilyFaces catches the collision
   * and reports it as a CodedException, before Android's FontFamily.Builder ever gets a chance to
   * throw its own IllegalArgumentException.
   */
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
      // expected: DroidSans.ttf loaded twice with no declared weight/style resolves to the same
      // weight+slant pair both times.
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
