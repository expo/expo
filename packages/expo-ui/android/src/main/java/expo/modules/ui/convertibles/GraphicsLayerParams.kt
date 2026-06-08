package expo.modules.ui.convertibles

import android.graphics.Color
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.ui.BuiltinShapeRecord
import expo.modules.kotlin.types.OptimizedRecord

enum class CompositingStrategyType(val value: String) : Enumerable {
  AUTO("auto"),
  OFFSCREEN("offscreen"),
  MODULATE("modulate")
}

@OptimizedRecord
internal data class GraphicsLayerParams(
  @Field val cameraDistance: Float = 8f,
  @Field val transformOriginX: Float = 0.5f,
  @Field val transformOriginY: Float = 0.5f,
  @Field val clip: Boolean = false,
  @Field val shape: BuiltinShapeRecord? = null,
  @Field val ambientShadowColor: Color? = null,
  @Field val spotShadowColor: Color? = null,
  @Field val compositingStrategy: CompositingStrategyType? = null
) : Record
