import ExpoModulesCore

// `weight`/`style` are the JS-declared values, used only as a fallback when the font file's
// own traits can't be read.
@Record
struct FontFaceRecord {
  var localUri: URL?
  var weight: Int?
  // "normal" | "italic"
  var style: String?
}
