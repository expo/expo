package devmenu.com.th3rdwave.safeareacontext

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class EdgeInsets(
  @Field var top: Float,
  @Field var right: Float,
  @Field var bottom: Float,
  @Field var left: Float
) : Record

