package devmenu.com.th3rdwave.safeareacontext

import expo.modules.kotlin.records.Field

data class Rect(
  @Field val x: Float,
  @Field val y: Float,
  @Field val width: Float,
  @Field val height: Float
)
