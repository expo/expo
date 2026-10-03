// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.fonts.Font
import android.graphics.fonts.FontFamily
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.test.ext.junit.runners.AndroidJUnit4
import java.io.File
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.channels.FileChannel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Checks that a variable font renders at the weight `fontWeight` asks for, rather than rendering
 * its default instance at every weight or letting the system fake a bold from it.
 *
 * Fonts come from `/system/fonts` so that no multi-megabyte fixture has to be committed. Devices
 * ship both variable and static fonts there; the tests skip rather than fail when one can't be
 * found.
 */
@RunWith(AndroidJUnit4::class)
@RequiresApi(Build.VERSION_CODES.Q)
class VariableTypefacesTest {
  private var variableFont: File? = null
  private var staticFont: File? = null

  @Before
  fun findSystemFonts() {
    assumeTrue(
      "Variable typefaces are only assembled on API 29 and above",
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
    )

    val fonts = File("/system/fonts").listFiles().orEmpty()
      .filter { it.extension == "ttf" || it.extension == "otf" }
      .sortedBy { it.name }

    // Most of the variable fonts on a device are script-specific — Adlam, Armenian and so on —
    // and would render the Latin sample out of the fallback font rather than out of the axis,
    // which is the opposite of what these tests are checking.
    variableFont = fonts
      .filter { FontVariationAxes.readWeightAxis(map(it)) != null }
      .firstOrNull { coversSample(it) }
    staticFont = fonts.firstOrNull { FontVariationAxes.readWeightAxis(map(it)) == null }

    assumeTrue("No variable font covering \"$SAMPLE\" found in /system/fonts", variableFont != null)
  }

  /** Whether [file] has a glyph for every character of the sample, without falling back. */
  private fun coversSample(file: File): Boolean = try {
    val family = FontFamily.Builder(Font.Builder(map(file)).build()).build()
    val paint = Paint().apply {
      // An empty fallback name leaves the typeface with nothing but this font to draw from.
      typeface = Typeface.CustomFallbackBuilder(family).setSystemFallback("").build()
    }
    SAMPLE.all { paint.hasGlyph(it.toString()) }
  } catch (_: Exception) {
    false
  }

  /** Whichever way [VariableTypefaces.build] gets there on this device. */
  @Test
  fun instancesTheAxis() {
    val typeface = VariableTypefaces.build(map(variableFont!!))
    assertHeavierWeightsPutDownMoreInk(typeface)
    assertMatchesTheFontInstancedDirectly(typeface)
  }

  /**
   * The same properties on the family we assemble ourselves.
   *
   * [VariableTypefaces.build] only takes that path below Android 15, so the test above exercises
   * `FontFamily.Builder.buildVariableFamily` on every API level CI runs. Without this, the branch
   * that ships to Android 10 through 14 would go unchecked.
   */
  @Test
  fun instancesTheAxisWithoutTheFramework() {
    val font = variableFont!!
    val family = VariableTypefaces.buildInstancedFamily(map(font))
    assertNotNull("${font.name} declares a `wght` axis but wasn't assembled by hand", family)

    val typeface = typefaceFrom(family!!)
    assertHeavierWeightsPutDownMoreInk(typeface)
    assertMatchesTheFontInstancedDirectly(typeface)
  }

  private fun assertHeavierWeightsPutDownMoreInk(typeface: Typeface?) {
    val font = variableFont!!
    assertNotNull("${font.name} declares a `wght` axis but wasn't built as a variable typeface", typeface)

    val axis = FontVariationAxes.readWeightAxis(map(font))!!
    val weights = FontVariationAxes.weightsFor(axis)
    assumeTrue("${font.name}'s axis is too narrow to compare weights: $axis", weights.size >= 2)

    val ink = weights.map { it to inkCoverage(typeface!!, it) }
    Log.i(TAG, "${font.name} axis=$axis ink by weight: $ink")

    // The whole point of the change: the weights come out of the axis, so the heaviest instance
    // puts strictly more ink on the canvas than the lightest. Were the axis ignored, every weight
    // would draw the default instance and these would all come out equal.
    val (lightestWeight, lightest) = ink.first()
    val (heaviestWeight, heaviest) = ink.last()
    assertTrue(
      "${font.name}: weight $heaviestWeight drew $heaviest ink, not more than weight " +
        "$lightestWeight at $lightest. Measured: $ink",
      heaviest > lightest
    )

    // Adjacent steps only have to be monotonic. Requiring a strict increase between them would be
    // flaky: `weightsFor` clamps to the ends of the axis, so a narrow one yields neighbours a few
    // units apart — 295 and 300, say — whose stems land on the same pixels at this size.
    ink.zipWithNext { (lighterWeight, lighter), (heavierWeight, heavier) ->
      assertTrue(
        "${font.name}: weight $heavierWeight drew $heavier ink, less than weight $lighterWeight " +
          "at $lighter. Measured: $ink",
        heavier >= lighter
      )
    }
  }

  private fun assertMatchesTheFontInstancedDirectly(typeface: Typeface?) {
    val font = variableFont!!
    assertNotNull("${font.name} declares a `wght` axis but wasn't built as a variable typeface", typeface)

    val axis = FontVariationAxes.readWeightAxis(map(font))!!
    val heaviest = FontVariationAxes.weightsFor(axis).last()

    // Asking the assembled family for the heaviest weight has to land on the same pixels as
    // instancing the font at that weight directly. Declaring the weights without applying the
    // axis would also dodge the synthetic bold below, so comparing against that alone proves
    // nothing — this is the assertion that pins the axis down.
    assertEquals(
      "${font.name} at weight $heaviest didn't render as the font instanced at 'wght' $heaviest, " +
        "so the requested weight isn't selecting the right instance",
      render(instancedAt(font, heaviest), heaviest).toList(),
      render(typeface!!, heaviest).toList()
    )

    // And it must not be the old behaviour: one default instance with a system-faked bold.
    assertNotEquals(
      "${font.name} at weight $heaviest rendered identically to the synthetically emboldened " +
        "default instance, so the axis isn't being applied",
      render(Typeface.createFromFile(font), heaviest).toList(),
      render(typeface, heaviest).toList()
    )
  }

  /** Wraps [family] the way [VariableTypefaces.build] does, so renders are comparable. */
  private fun typefaceFrom(family: FontFamily): Typeface =
    Typeface.CustomFallbackBuilder(family)
      .setSystemFallback("sans-serif")
      .build()

  /** The font instanced at exactly [weight], built without going through [VariableTypefaces]. */
  private fun instancedAt(file: File, weight: Int): Typeface {
    val font = Font.Builder(map(file)).setFontVariationSettings("'wght' $weight").build()
    return Typeface.CustomFallbackBuilder(FontFamily.Builder(font).build())
      .setSystemFallback("sans-serif")
      .build()
  }

  @Test
  fun leavesStaticFontsAlone() {
    val font = staticFont
    assumeTrue("No static font found in /system/fonts", font != null)

    // Returning null is what keeps a static font on the untouched `createFromAsset` path, where
    // the system still synthesizes bold for it. Instancing one would suppress that.
    assertNull(
      "${font!!.name} has no `wght` axis but was built as a variable typeface",
      VariableTypefaces.build(map(font))
    )
    assertNull(
      "${font.name} has no `wght` axis but was assembled by hand anyway",
      VariableTypefaces.buildInstancedFamily(map(font))
    )
  }

  private fun map(file: File): ByteBuffer =
    FileInputStream(file).use { it.channel.map(FileChannel.MapMode.READ_ONLY, 0, it.channel.size()) }

  /** The number of inked pixels [typeface] draws at [weight]. */
  private fun inkCoverage(typeface: Typeface, weight: Int): Int = render(typeface, weight).count { it }

  /** Draws the sample at [weight] and returns one flag per pixel: whether it was inked. */
  private fun render(typeface: Typeface, weight: Int): BooleanArray {
    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      this.typeface = Typeface.create(typeface, weight, false)
      textSize = 72f
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

  private companion object {
    const val TAG = "VariableTypefacesTest"
    const val SAMPLE = "Hamburgefonstiv"
    const val WIDTH = 720
    const val HEIGHT = 120

    // Comfortably below the antialiased edges, so a heavier stem counts and a fringe doesn't.
    const val INK_THRESHOLD = 128
  }
}
