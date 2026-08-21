package expo.modules.font

import expo.modules.kotlin.exception.CodedException

private const val MIN_WEIGHT = 1
private const val MAX_WEIGHT = 1000
private const val DEFAULT_WEIGHT = 400

/**
 * Pure Kotlin validation and selection logic for a font family made of multiple faces.
 * Kept free of android.* imports so it can be unit-tested on the plain JVM.
 */
object FontFamilyFaces {
  private fun isItalic(style: String?) = style == "italic"

  /**
   * Validates that no two faces of the family claim the same weight+style pair, and that every
   * declared weight is within the 1..1000 range accepted by Android's FontStyle.
   */
  fun assertNoDuplicateFaces(fontFamilyName: String, faces: List<FontFaceRecord>) {
    val seenFaces = mutableMapOf<Pair<Int, Boolean>, String>()

    for (face in faces) {
      val weight = face.weight ?: DEFAULT_WEIGHT
      if (weight !in MIN_WEIGHT..MAX_WEIGHT) {
        throw CodedException(
          "Font face '${face.localUri}' for family '$fontFamilyName' declares weight $weight, " +
            "but weight must be between $MIN_WEIGHT and $MAX_WEIGHT. " +
            "Set the 'weight' of this face to a value in that range."
        )
      }

      val italic = isItalic(face.style)
      val key = weight to italic
      val conflictingUri = seenFaces[key]
      if (conflictingUri != null) {
        throw CodedException(
          "Font family '$fontFamilyName' declares two faces with weight $weight and " +
            "style '${if (italic) "italic" else "normal"}': '$conflictingUri' and '${face.localUri}'. " +
            "Give each face of a family a distinct weight or style so the correct file is selected at render time."
        )
      }
      seenFaces[key] = face.localUri
    }
  }

  /**
   * The face to load when only one can be (below API 29): declared weight closest to 400,
   * upright beats italic at equal distance, then lowest index.
   */
  fun defaultFaceIndex(faces: List<FontFaceRecord>): Int {
    var bestIndex = 0
    var bestDistance = Int.MAX_VALUE
    var bestIsItalic = true

    faces.forEachIndexed { index, face ->
      val distance = kotlin.math.abs((face.weight ?: DEFAULT_WEIGHT) - DEFAULT_WEIGHT)
      val isItalic = isItalic(face.style)

      val isBetter = distance < bestDistance || (distance == bestDistance && bestIsItalic && !isItalic)
      if (isBetter) {
        bestIndex = index
        bestDistance = distance
        bestIsItalic = isItalic
      }
    }

    return bestIndex
  }
}
