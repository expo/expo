---
'@expo/ui': patch
---

[Android] Fix a numeric `width()` modifier crashing the app on launch with `FieldCastException: Cannot cast value for field 'width'` since the `IntrinsicSize` support added in 57.0.22 / 58.0.9. JS numbers reach the modifier record as `Double`, which matched neither branch of `Either<Int, IntrinsicSizeType>`; the field is now `Either<Double, IntrinsicSizeType>`, so numeric widths convert again and `width(IntrinsicSize.Min|Max)` keeps working.
