import ExpoModulesCore

// `weight`/`style` are the JS-declared values, used only as a fallback when the font file's
// own traits can't be read.
struct FontFaceRecord: Record {
  @Field var localUri: URL?
  @Field var weight: Int?
  // "normal" | "italic"
  @Field var style: String?
}
