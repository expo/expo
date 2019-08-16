package expo.modules.errorrecovery

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.JsonIOException
import com.google.gson.reflect.TypeToken

import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ExpoMethod

private const val ERROR_STORE = "expo.modules.errorrecovery.store"

open class ErrorRecoveryModule(context: Context) : ExportedModule(context) {
  protected lateinit var mSharedPreferences: SharedPreferences
  private var propsReadyToSave: String? = null

  override fun getName(): String = "ExpoErrorRecovery"


  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mSharedPreferences = context.applicationContext.getSharedPreferences(ERROR_STORE, Context.MODE_PRIVATE)
  }

  @ExpoMethod
  fun setRecoveryProps(props: Map<String, Any>, promise: Promise) {
    return try {
      propsReadyToSave = Gson().toJson(props)
      promise.resolve(null)
    } catch (exception: JsonIOException) {
      promise.reject("E_INVALID_PROPS", "Cannot parse props.", exception)
    }
  }

  @ExpoMethod
  fun saveRecoveryProps(promise: Promise) {
    propsReadyToSave?.let {
      pushProps(it)
    }
    promise.resolve(null)
  }

  override fun getConstants(): Map<String, Any>? {
    popProps().let {
      return if (it.isEmpty()) {
        null
      } else {
        mapOf("errors" to it)
      }
    }
  }

  protected fun getPropsFromString(propsString: String): Map<String, Any> {
    return Gson().fromJson(propsString, object : TypeToken<Map<String, Any>>() {}.type)
  }

  protected open fun pushProps(props: String) {
    mSharedPreferences.edit().putString("errorRecovery", props).apply()
  }

  protected open fun popProps(): Map<String, Any?> {
    with(mSharedPreferences.getString("errorRecovery", "")) {
      return if (isNotEmpty()) {
        mSharedPreferences.edit().remove("errorRecovery").apply()
        getPropsFromString(this)
      } else {
        emptyMap()
      }
    }
  }


}
