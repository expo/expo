package expo.modules.font

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.fonts.Font
import android.graphics.fonts.FontFamily
import android.os.Build
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.SdkSuppress
import expo.modules.kotlin.exception.CodedException
import java.io.File
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.channels.FileChannel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Exercises [MultiFaceTypeface.build] — the family construction `loadFontFamilyAsync` runs —
 * against real font data.
 *
 * There's no separate static italic file on this image, and `DroidSans.ttf` is byte-for-byte
 * `Roboto-Regular.ttf`. These tests instead declare faces of `Roboto-Regular.ttf`'s own `wght`
 * axis, so a face rendered at the wrong weight draws a measurably different amount of ink.
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
  private val variableFile = File("/system/fonts/Roboto-Regular.ttf")

  private var lightWeight = 0
  private var heavyWeight = 0

  @Before
  fun findWeightAxis() {
    assertTrue(
      "These tests need $variableFile and it is missing. The image under test does not ship the " +
        "AOSP font set the fixture is built from. Run them on an emulator image that ships it, " +
        "or point the fixture at a variable font file this image has.",
      variableFile.exists()
    )

    val axis = FontVariationAxes.readWeightAxis(map(variableFile))
    assertNotNull(
      "$variableFile on this image has no `wght` axis. The fixture renders that axis at two " +
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

  private fun face(weight: Int? = null, style: String? = null) =
    FontFaceRecord(localUri = variableFile.path, weight = weight, style = style)

  private fun buildFamily(faces: List<FontFaceRecord>): Typeface =
    MultiFaceTypeface.build(
      "MultiFaceTypefaceTest",
      faces,
      faces.map { FontSource.LocalFile(variableFile) }
    )

  /** The font instanced at exactly [weight], built without going through [MultiFaceTypeface]. */
  private fun instancedAt(weight: Int): Typeface {
    val font = Font.Builder(map(variableFile)).setFontVariationSettings("'wght' $weight").build()
    return VariableTypefaces.wrapWithSystemFallback(FontFamily.Builder(font).build())
  }

  private fun inkedPixelCount(typeface: Typeface, weight: Int, italic: Boolean): Int =
    render(typeface, weight, italic).count { it }

  /**
   * Draws the sample at [weight] and returns one flag per pixel: whether it was inked. Renders a
   * whole word, not a single glyph: a lone glyph can round a weight difference away once
   * antialiasing rounds it to the same pixels.
   */
  private fun render(typeface: Typeface, weight: Int, italic: Boolean = false): BooleanArray {
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
    return BooleanArray(pixels.size) { Color.red(pixels[it]) < INK_THRESHOLD }
  }

  // Two variable faces with no declared weight — the upright/italic pairing a variable family
  // ships as. Each face has to keep its `wght` axis, not render its default instance throughout.
  // Synthetic bold also adds ink, so more ink alone proves nothing: the render has to match the
  // font instanced at the weight directly, and differ from the emboldened default instance.
  @Test
  fun familyOfVariableFacesKeepsWeightInstancing() {
    val typeface = buildFamily(listOf(face(), face(style = "italic")))

    assertEquals(
      "Requesting weight $heavyWeight didn't render as the font instanced at 'wght' " +
        "$heavyWeight, so the faces lost their `wght` axis.",
      render(instancedAt(heavyWeight), heavyWeight).toList(),
      render(typeface, heavyWeight).toList()
    )
    assertNotEquals(
      "Requesting weight $heavyWeight rendered identically to the synthetically emboldened " +
        "default instance, so the axis isn't being applied.",
      render(Typeface.createFromFile(variableFile), heavyWeight).toList(),
      render(typeface, heavyWeight).toList()
    )
  }

  // A declared weight on a variable face has to render that weight's instance, not just label
  // the face with it while the glyphs stay at the file's default.
  @Test
  fun declaredWeightRendersItsInstance() {
    val typeface = buildFamily(listOf(face(weight = lightWeight), face(weight = heavyWeight)))

    val lightInk = inkedPixelCount(typeface, lightWeight, italic = false)
    val heavyInk = inkedPixelCount(typeface, heavyWeight, italic = false)

    assertTrue(
      "Expected the face declared at weight $heavyWeight to draw more ink than the face " +
        "declared at $lightWeight ($heavyInk vs $lightInk). Equal ink means declared weights " +
        "only label the faces and both render the file's default instance.",
      heavyInk > lightInk
    )
  }

  // No static italic file exists on this image, so this test proves selection via the declared
  // style, not rendered slant: the italic face is the lighter one, so picking it shows as less
  // ink. The faces sit 199 weight apart because Android scores a face's weight distance in
  // hundreds against a slant-mismatch penalty of 2 — a larger gap would out-score the slant.
  @Test
  fun declaredStyleDrivesSelection() {
    val uprightWeight = lightWeight + 199
    val typeface = buildFamily(
      listOf(face(weight = lightWeight, style = "italic"), face(weight = uprightWeight))
    )

    val italicInk = inkedPixelCount(typeface, lightWeight, italic = true)
    val uprightInk = inkedPixelCount(typeface, lightWeight, italic = false)

    assertTrue(
      "Expected italic=true to select the face declared italic (weight $lightWeight, less ink), " +
        "not the upright face (weight $uprightWeight, more ink): italic=$italicInk ink, " +
        "upright=$uprightInk ink",
      italicInk < uprightInk
    )
  }

  @Test
  fun duplicateResolvedWeightAndSlantThrowsCodedException() {
    try {
      buildFamily(listOf(face(), face()))
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
