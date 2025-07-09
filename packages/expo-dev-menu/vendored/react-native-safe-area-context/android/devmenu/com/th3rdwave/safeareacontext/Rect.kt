package devmenu.com.th3rdwave.safeareacontext

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class Rect(
  @Field val x: Float,
  @Field val y: Float,
  @Field val width: Float,
  @Field val height: Float
) : Record
