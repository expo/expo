// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.di

import android.app.Application
import android.content.Context
import android.os.Handler
import android.os.Looper
import com.facebook.proguard.annotations.DoNotStrip
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.db.UpdatesDatabase
import host.exp.exponent.ExpoHandler
import host.exp.exponent.ExponentManifest
import host.exp.exponent.analytics.EXL
import host.exp.exponent.kernel.services.ExpoKernelServiceRegistry
import host.exp.exponent.network.ExponentNetwork
import host.exp.exponent.storage.ExponentSharedPreferences
import java.lang.reflect.Field
import javax.inject.Inject

class NativeModuleDepsProvider(application: Application) {
  @Inject
  @DoNotStrip
  val mContext: Context = application

  @Inject
  @DoNotStrip
  val mApplicationContext: Application = application

  @Inject
  @DoNotStrip
  val mExpoHandler: ExpoHandler = ExpoHandler(Handler(Looper.getMainLooper()))

  @Inject
  @DoNotStrip
  val mExponentSharedPreferences: ExponentSharedPreferences = ExponentSharedPreferences(mContext)

  @Inject
  @DoNotStrip
  val mExponentNetwork: ExponentNetwork = ExponentNetwork(mContext, mExponentSharedPreferences)

  @Inject
  @DoNotStrip
  var mExponentManifest: ExponentManifest = ExponentManifest(mContext, mExponentSharedPreferences)

  @Inject
  @DoNotStrip
  var mKernelServiceRegistry: ExpoKernelServiceRegistry = ExpoKernelServiceRegistry(mContext, mExponentSharedPreferences)

  @Inject
  @DoNotStrip
  val mUpdatesDatabaseHolder: DatabaseHolder = DatabaseHolder(UpdatesDatabase.getInstance(mContext))

  private val classToInstanceMap = mutableMapOf<Class<*>, Any>()

  fun add(clazz: Class<*>, instance: Any) {
    classToInstanceMap[clazz] = instance
  }

  fun inject(clazz: Class<*>, target: Any) {
    for (field in clazz.declaredFields) {
      injectFieldInTarget(target, field)
    }
  }

  private fun injectFieldInTarget(target: Any, field: Field) {
    if (field.isAnnotationPresent(Inject::class.java)) {
      val fieldClazz = field.type
      if (!classToInstanceMap.containsKey(fieldClazz)) {
        throw RuntimeException("NativeModuleDepsProvider could not find object for class $fieldClazz")
      }
      val instance = classToInstanceMap[fieldClazz]
      try {
        field.isAccessible = true
        field[target] = instance
      } catch (e: IllegalAccessException) {
        EXL.e(TAG, e.toString())
      }
    }
  }

  companion object {
    private val TAG = NativeModuleDepsProvider::class.java.simpleName

    @JvmStatic lateinit var instance: NativeModuleDepsProvider
      private set

    private var useTestInstance = false

    fun initialize(application: Application) {
      if (!useTestInstance) {
        instance = NativeModuleDepsProvider(application)
      }
    }

    // Only for testing!
    fun setTestInstance(instance: NativeModuleDepsProvider) {
      Companion.instance = instance
      useTestInstance = true
    }
  }

  init {
    for (field in NativeModuleDepsProvider::class.java.declaredFields) {
      if (field.isAnnotationPresent(Inject::class.java)) {
        try {
          classToInstanceMap[field.type] = field[this]
        } catch (e: IllegalAccessException) {
          EXL.e(TAG, e.toString())
        }
      }
    }
  }
}
