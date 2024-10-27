package expo.modules.kotlin.types

import android.os.Build
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableType
import expo.modules.kotlin.exception.UnexpectedException
import expo.modules.kotlin.jni.CppType
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.jni.SingleType
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@RequiresApi(Build.VERSION_CODES.O)
class DateTypeConverter(isOptional: Boolean) : DynamicAwareTypeConverters<LocalDate>(isOptional) {
  override fun convertFromDynamic(value: Dynamic): LocalDate {
    return when (value.type) {
      ReadableType.String -> LocalDate.parse(value.asString(), DateTimeFormatter.ISO_DATE_TIME)
      ReadableType.Number -> convertFromLong(value.asDouble().toLong())
      else -> throw UnexpectedException("Unknown argument type: ${value.type}")
    }
  }

  override fun convertFromAny(value: Any): LocalDate {
    return when (value) {
      is String -> LocalDate.parse(value, DateTimeFormatter.ISO_DATE_TIME)
      is Long -> convertFromLong(value)
      else -> throw UnexpectedException("Unknown argument type: ${value::class}")
    }
  }

  private fun convertFromLong(value: Long): LocalDate {
    val instant = Instant.ofEpochMilli(value)
    return instant.atZone(ZoneId.systemDefault()).toLocalDate()
  }

  override fun getCppRequiredTypes() = ExpectedType(
    SingleType(CppType.INT),
    SingleType(CppType.STRING)
  )

  override fun isTrivial() = false
}
