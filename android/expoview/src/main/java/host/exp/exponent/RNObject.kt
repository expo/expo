// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent

import host.exp.exponent.analytics.EXL
import host.exp.expoview.BuildConfig
import java.lang.reflect.Constructor
import java.lang.reflect.Field
import java.lang.reflect.InvocationTargetException
import java.lang.reflect.Method

// TODO: add type checking in DEBUG
class RNObject {
  private val className: String // Unversioned
  private var clazz: Class<*>? = null // Versioned
  private var instance: Any? = null // Versioned

  // We ignore the version of clazz
  constructor(clazz: Class<*>?) {
    className = removeVersionFromClass(clazz)
  }

  constructor(className: String) {
    this.className = className
  }

  private constructor(obj: Any?) {
    assign(obj)
    className = removeVersionFromClass(clazz)
  }

  val isNull: Boolean
    get() = instance == null
  val isNotNull: Boolean
    get() = instance != null

  // required for "unversioned" flavor check
  fun loadVersion(version: String): RNObject {
    try {
      clazz = if (version == UNVERSIONED || BuildConfig.FLAVOR == "unversioned") {
        if (className.startsWith("host.exp.exponent")) {
          Class.forName("versioned.$className")
        } else {
          Class.forName(className)
        }
      } else {
        Class.forName("abi${version.replace('.', '_')}.$className")
      }
    } catch (e: ClassNotFoundException) {
      EXL.e(TAG, e)
    }
    return this
  }

  fun assign(obj: Any?) {
    if (obj != null) {
      clazz = obj.javaClass
    }
    instance = obj
  }

  fun get(): Any? {
    return instance
  }

  fun rnClass(): Class<*>? {
    return clazz
  }

  fun version(): String {
    return versionForClassname(clazz!!.name)
  }

  fun construct(vararg args: Any?): RNObject {
    try {
      instance = getConstructorWithTypes(clazz, *objectsToClasses(*args)).newInstance(*args)
    } catch (e: NoSuchMethodException) {
      EXL.e(TAG, e)
    } catch (e: InvocationTargetException) {
      EXL.e(TAG, e)
    } catch (e: InstantiationException) {
      EXL.e(TAG, e)
    } catch (e: IllegalAccessException) {
      EXL.e(TAG, e)
    }
    return this
  }

  fun call(name: String, vararg args: Any?): Any? {
    return callWithReceiver(instance, name, *args)
  }

  fun callRecursive(name: String, vararg args: Any?): RNObject? {
    val result = call(name, *args) ?: return null
    return wrap(result)
  }

  fun callStatic(name: String, vararg args: Any?): Any? {
    return callWithReceiver(null, name, *args)
  }

  fun callStaticRecursive(name: String, vararg args: Any?): RNObject {
    return wrap(callStatic(name, *args))
  }

  fun setField(name: String, value: Any) {
    setFieldWithReceiver(instance, name, value)
  }

  fun setStaticField(name: String, value: Any) {
    setFieldWithReceiver(null, name, value)
  }

  private fun callWithReceiver(receiver: Any?, name: String, vararg args: Any?): Any? {
    try {
      return getMethodWithTypes(clazz, name, *objectsToClasses(*args)).invoke(receiver, *args)
    } catch (e: IllegalAccessException) {
      EXL.e(TAG, e)
      e.printStackTrace()
    } catch (e: InvocationTargetException) {
      EXL.e(TAG, e)
      e.printStackTrace()
    } catch (e: NoSuchMethodException) {
      EXL.e(TAG, e)
      e.printStackTrace()
    } catch (e: NoSuchMethodError) {
      EXL.e(TAG, e)
      e.printStackTrace()
    } catch (e: Throwable) {
      EXL.e(TAG, "Runtime exception in RNObject when calling method $name: $e")
    }
    return null
  }

  private fun setFieldWithReceiver(receiver: Any?, name: String, value: Any) {
    try {
      getFieldWithType(clazz, name, value.javaClass)[receiver] = value
    } catch (e: IllegalAccessException) {
      EXL.e(TAG, e)
      e.printStackTrace()
    } catch (e: NoSuchFieldException) {
      EXL.e(TAG, e)
      e.printStackTrace()
    } catch (e: NoSuchMethodError) {
      EXL.e(TAG, e)
      e.printStackTrace()
    } catch (e: Throwable) {
      EXL.e(TAG, "Runtime exception in RNObject when setting field $name: $e")
    }
  }

  fun onHostResume(one: Any?, two: Any?) {
    call("onHostResume", one, two)
  }

  fun onHostPause() {
    call("onHostPause")
  }

  fun onHostDestroy() {
    call("onHostDestroy")
  }

  companion object {
    private val TAG = RNObject::class.java.simpleName

    const val UNVERSIONED = "UNVERSIONED"

    @JvmStatic fun wrap(obj: Any?): RNObject {
      return RNObject(obj)
    }

    fun versionedEnum(sdkVersion: String, className: String, value: String): Any {
      return try {
        RNObject(className).loadVersion(sdkVersion).rnClass()!!.getDeclaredField(value)[null]
      } catch (e: IllegalAccessException) {
        EXL.e(TAG, e)
        throw IllegalStateException("Unable to create enum: $className.value", e)
      } catch (e: NoSuchFieldException) {
        EXL.e(TAG, e)
        throw IllegalStateException("Unable to create enum: $className.value", e)
      }
    }

    fun versionForClassname(classname: String): String {
      return if (classname.startsWith("abi")) {
        val abiVersion = classname.split(".").toTypedArray()[0]
        abiVersion.substring(3)
      } else {
        UNVERSIONED
      }
    }

    private fun removeVersionFromClass(clazz: Class<*>?): String {
      val name = clazz!!.name
      return if (name.startsWith("abi")) {
        name.substring(name.indexOf('.') + 1)
      } else name
    }

    private fun objectsToClasses(vararg objects: Any?): Array<Class<*>?> {
      val classes: Array<Class<*>?> = arrayOfNulls(objects.size)
      for (i in objects.indices) {
        if (objects[i] != null) {
          classes[i] = objects[i]!!.javaClass
        }
      }
      return classes
    }

    // Allow types that are too specific so that we don't have to specify exact classes
    @Throws(NoSuchMethodException::class)
    private fun getMethodWithTypes(clazz: Class<*>?, name: String, vararg types: Class<*>?): Method {
      val methods = clazz!!.methods
      for (i in methods.indices) {
        val method = methods[i]
        if (method.name != name) {
          continue
        }
        val currentMethodTypes = method.parameterTypes
        if (currentMethodTypes.size != types.size) {
          continue
        }
        var isValid = true
        for (j in currentMethodTypes.indices) {
          if (!isAssignableFrom(currentMethodTypes[j], types[j])) {
            isValid = false
            break
          }
        }
        if (!isValid) {
          continue
        }
        return method
      }
      throw NoSuchMethodException()
    }

    // Allow boxed -> unboxed assignments
    private fun isAssignableFrom(c1: Class<*>, c2: Class<*>?): Boolean {
      if (c2 == null) {
        // There's not really a good way to handle this.
        return true
      }
      if (c1.isAssignableFrom(c2)) {
        return true
      }
      if (c1 == Boolean::class.javaPrimitiveType && c2 == Boolean::class.java) {
        return true
      } else if (c1 == Byte::class.javaPrimitiveType && c2 == Byte::class.java) {
        return true
      } else if (c1 == Char::class.javaPrimitiveType && c2 == Char::class.java) {
        return true
      } else if (c1 == Float::class.javaPrimitiveType && c2 == Float::class.java) {
        return true
      } else if (c1 == Int::class.javaPrimitiveType && c2 == Int::class.java) {
        return true
      } else if (c1 == Long::class.javaPrimitiveType && c2 == Long::class.java) {
        return true
      } else if (c1 == Short::class.javaPrimitiveType && c2 == Short::class.java) {
        return true
      } else if (c1 == Double::class.javaPrimitiveType && c2 == Double::class.java) {
        return true
      }
      return false
    }

    // Allow types that are too specific so that we don't have to specify exact classes
    @Throws(NoSuchMethodException::class)
    private fun getConstructorWithTypes(clazz: Class<*>?, vararg types: Class<*>?): Constructor<*> {
      val constructors = clazz!!.constructors
      for (i in constructors.indices) {
        val constructor = constructors[i]
        val currentConstructorTypes = constructor.parameterTypes
        if (currentConstructorTypes.size != types.size) {
          continue
        }
        var isValid = true
        for (j in currentConstructorTypes.indices) {
          if (!isAssignableFrom(currentConstructorTypes[j], types[j])) {
            isValid = false
            break
          }
        }
        if (!isValid) {
          continue
        }
        return constructor
      }
      throw NoSuchMethodError()
    }

    @Throws(NoSuchFieldException::class)
    private fun getFieldWithType(clazz: Class<*>?, name: String, type: Class<*>): Field {
      val fields = clazz!!.fields
      for (i in fields.indices) {
        val field = fields[i]
        if (field.name != name) {
          continue
        }
        val currentFieldType = field.type
        if (isAssignableFrom(currentFieldType, type)) {
          return field
        }
      }
      throw NoSuchFieldException()
    }
  }
}
