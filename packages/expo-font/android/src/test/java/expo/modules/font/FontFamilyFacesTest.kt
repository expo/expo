package expo.modules.font

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

class FontFamilyFacesTest {

  @Test
  fun duplicateWeightAndStyleThrowsNamingBothFiles() {
    val faces = listOf(
      FontFaceRecord(localUri = "first.ttf", weight = 400, style = null),
      FontFaceRecord(localUri = "second.ttf", weight = 400, style = "normal")
    )

    try {
      FontFamilyFaces.assertNoDuplicateFaces("MyFamily", faces)
      fail("Expected an exception for duplicate weight+style")
    } catch (e: Exception) {
      assertTrue(e.message!!.contains("MyFamily"))
      assertTrue(e.message!!.contains("first.ttf"))
      assertTrue(e.message!!.contains("second.ttf"))
    }
  }

  @Test
  fun distinctFacesPass() {
    val faces = listOf(
      FontFaceRecord(localUri = "regular.ttf", weight = 400, style = null),
      FontFaceRecord(localUri = "bold.ttf", weight = 700, style = null),
      FontFaceRecord(localUri = "italic.ttf", weight = 400, style = "italic")
    )

    // should not throw
    FontFamilyFaces.assertNoDuplicateFaces("MyFamily", faces)
  }

  @Test
  fun weightOutOfRangeThrows() {
    val tooLow = listOf(FontFaceRecord(localUri = "a.ttf", weight = 0, style = null))
    val tooHigh = listOf(FontFaceRecord(localUri = "b.ttf", weight = 1001, style = null))

    try {
      FontFamilyFaces.assertNoDuplicateFaces("MyFamily", tooLow)
      fail("Expected an exception for weight below 1")
    } catch (e: Exception) {
      assertTrue(e.message!!.contains("a.ttf"))
    }

    try {
      FontFamilyFaces.assertNoDuplicateFaces("MyFamily", tooHigh)
      fail("Expected an exception for weight above 1000")
    } catch (e: Exception) {
      assertTrue(e.message!!.contains("b.ttf"))
    }
  }

  @Test
  fun defaultFaceIndexPicksClosestTo400() {
    val faces = listOf(
      FontFaceRecord(localUri = "light.ttf", weight = 300, style = null),
      FontFaceRecord(localUri = "medium.ttf", weight = 450, style = null)
    )

    assertEquals(1, FontFamilyFaces.defaultFaceIndex(faces))
  }

  @Test
  fun defaultFaceIndexItalicWinsOnStrictlyCloserDistance() {
    // italic 400 -> distance 0; upright 500 -> distance 100. Italic wins on distance.
    val faces = listOf(
      FontFaceRecord(localUri = "italic400.ttf", weight = 400, style = "italic"),
      FontFaceRecord(localUri = "upright500.ttf", weight = 500, style = null)
    )

    assertEquals(0, FontFamilyFaces.defaultFaceIndex(faces))
  }

  @Test
  fun defaultFaceIndexUprightWinsAtEqualDistance() {
    // italic 300 -> distance 100; upright 500 -> distance 100. Equal distance: upright wins.
    val faces = listOf(
      FontFaceRecord(localUri = "italic300.ttf", weight = 300, style = "italic"),
      FontFaceRecord(localUri = "upright500.ttf", weight = 500, style = null)
    )

    assertEquals(1, FontFamilyFaces.defaultFaceIndex(faces))
  }

  @Test
  fun defaultFaceIndexTieBreaksOnLowestIndex() {
    val faces = listOf(
      FontFaceRecord(localUri = "first.ttf", weight = 400, style = null),
      FontFaceRecord(localUri = "second.ttf", weight = 400, style = null)
    )

    assertEquals(0, FontFamilyFaces.defaultFaceIndex(faces))
  }
}
