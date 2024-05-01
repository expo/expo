package expo.modules.kotlin

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Parcelable
import java.io.Serializable

inline fun <reified T : Parcelable> Intent.safeGetParcelableExtra(name: String): T? {
  return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    getParcelableExtra(name, T::class.java)
  } else {
    @Suppress("DEPRECATION")
    getParcelableExtra(name)
  }
}

inline fun <reified T : Parcelable> Bundle.safeGetParcelable(name: String): T? {
  return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    getParcelable(name, T::class.java)
  } else {
    @Suppress("DEPRECATION")
    getParcelable(name)
  }
}

inline fun <reified T : Serializable> Bundle.safeGetSerializable(name: String): T? {
  return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    getSerializable(name, T::class.java)
  } else {
    @Suppress("DEPRECATION")
    getSerializable(name) as T?
  }
}
