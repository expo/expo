import ExpoModulesCore

/**
 One face of a font family passed to `loadFontFamilyAsync`.
 `weight` and `style` are the JS-declared values; they're only used to pick a default face
 when the font file's own traits can't be read.
 */
struct FontFaceRecord: Record {
  @Field var localUri: URL? = nil
  @Field var weight: Int? = nil
  @Field var style: String? = nil // "normal" | "italic"
}
