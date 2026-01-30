@file:OptIn(ExperimentalMaterial3ExpressiveApi::class)

package expo.modules.ui

import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.MaterialShapes
import androidx.graphics.shapes.RoundedPolygon
import expo.modules.kotlin.types.Enumerable

enum class MaterialShapeType(val value: String) : Enumerable {
  COOKIE_4_SIDED("cookie4Sided"),
  COOKIE_6_SIDED("cookie6Sided"),
  COOKIE_7_SIDED("cookie7Sided"),
  COOKIE_9_SIDED("cookie9Sided"),
  COOKIE_12_SIDED("cookie12Sided"),

  CLOVER_4_LEAF("clover4Leaf"),
  CLOVER_8_LEAF("clover8Leaf"),

  SOFT_BURST("softBurst"),
  BOOM("boom"),

  OVAL("oval"),
  PILL("pill"),
  TRIANGLE("triangle"),
  DIAMOND("diamond"),
  PENTAGON("pentagon"),
  SUNNY("sunny"),
  VERY_SUNNY("verySunny"),

  FAN("fan"),

  PIXEL_CIRCLE("pixelCircle"),
  PIXEL_TRIANGLE("pixelTriangle"),

  GHOSTISH("ghostish"),

  BUN("bun"),

  HEART("heart"),

  ARCH("arch"),

  SLANTED("slanted"),

  PUFFY("puffy"),
  PUFFY_DIAMOND("puffyDiamond");

  fun toRoundedPolygon(): RoundedPolygon = when (this) {
    COOKIE_4_SIDED -> MaterialShapes.Cookie4Sided
    COOKIE_6_SIDED -> MaterialShapes.Cookie6Sided
    COOKIE_7_SIDED -> MaterialShapes.Cookie7Sided
    COOKIE_9_SIDED -> MaterialShapes.Cookie9Sided
    COOKIE_12_SIDED -> MaterialShapes.Cookie12Sided
    CLOVER_4_LEAF -> MaterialShapes.Clover4Leaf
    CLOVER_8_LEAF -> MaterialShapes.Clover8Leaf
    SOFT_BURST -> MaterialShapes.SoftBurst
    BOOM -> MaterialShapes.Boom
    OVAL -> MaterialShapes.Oval
    PILL -> MaterialShapes.Pill
    TRIANGLE -> MaterialShapes.Triangle
    DIAMOND -> MaterialShapes.Diamond
    PENTAGON -> MaterialShapes.Pentagon
    SUNNY -> MaterialShapes.Sunny
    VERY_SUNNY -> MaterialShapes.VerySunny
    FAN -> MaterialShapes.Fan
    PIXEL_CIRCLE -> MaterialShapes.PixelCircle
    PIXEL_TRIANGLE -> MaterialShapes.PixelTriangle
    GHOSTISH -> MaterialShapes.Ghostish
    BUN -> MaterialShapes.Bun
    HEART -> MaterialShapes.Heart
    ARCH -> MaterialShapes.Arch
    SLANTED -> MaterialShapes.Slanted
    PUFFY -> MaterialShapes.Puffy
    PUFFY_DIAMOND -> MaterialShapes.PuffyDiamond
  }
}
