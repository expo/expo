// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent

import host.exp.exponent.analytics.EXL
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
      clazz = if (version == UNVERSIONED) {
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
      instance = getConstructorWithArgumentClassTypes(clazz, *objectsToJavaClassTypes(*args)).newInstance(*args)
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
    return callWithReceiver(instance, false, name, *args)
  }

  /** Similar to [call] but without capturing reflection [InvocationTargetException] */
  fun callWithThrowable(name: String, vararg args: Any?): Any? {
    return callWithReceiver(instance, true, name, *args)
  }

  fun callRecursive(name: String, vararg args: Any?): RNObject? {
    val result = call(name, *args) ?: return null
    return wrap(result)
  }

  fun callStatic(name: String, vararg args: Any?): Any? {
    return callWithReceiver(null, false, name, *args)
  }

  fun callStaticRecursive(name: String, vararg args: Any?): RNObject? {
    val result = callStatic(name, *args) ?: return null
    return wrap(result)
  }

  fun setField(name: String, value: Any) {
    setFieldWithReceiver(instance, name, value)
  }

  fun setStaticField(name: String, value: Any) {
    setFieldWithReceiver(null, name, value)
  }

  private fun callWithReceiver(receiver: Any?, rethrow: Boolean, name: String, vararg args: Any?): Any? {
    try {
      return getMethodWithArgumentClassTypes(clazz, name, *objectsToJavaClassTypes(*args)).invoke(receiver, *args)
    } catch (e: IllegalAccessException) {
      EXL.e(TAG, e)
      e.printStackTrace()
    } catch (e: InvocationTargetException) {
      EXL.e(TAG, e)
      e.printStackTrace()
      if (rethrow) {
        e.cause?.let {
          throw it
        }
      }
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

    @JvmStatic fun wrap(obj: Any): RNObject {
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
      } else {
        name
      }
    }

    private fun objectsToJavaClassTypes(vararg objects: Any?): Array<Class<*>?> {
      val classes: Array<Class<*>?> = arrayOfNulls(objects.size)
      for (i in objects.indices) {
        if (objects[i] != null) {
          classes[i] = objects[i]!!::class.java
        }
      }
      return classes
    }

    // Allow types that are too specific so that we don't have to specify exact classes
    @Throws(NoSuchMethodException::class)
    private fun getMethodWithArgumentClassTypes(clazz: Class<*>?, name: String, vararg argumentClassTypes: Class<*>?): Method {
      val methods = clazz!!.methods
      for (i in methods.indices) {
        val method = methods[i]
        if (method.name != name) {
          continue
        }
        val currentMethodParameterTypes = method.parameterTypes
        if (currentMethodParameterTypes.size != argumentClassTypes.size) {
          continue
        }
        var isValid = true
        for (j in currentMethodParameterTypes.indices) {
          if (!isAssignableFrom(currentMethodParameterTypes[j], argumentClassTypes[j])) {
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
    private fun isAssignableFrom(methodParameterClassType: Class<*>, argumentClassType: Class<*>?): Boolean {
      if (argumentClassType == null) {
        // There's not really a good way to handle this.
        return true
      }
      if (methodParameterClassType.isAssignableFrom(argumentClassType)) {
        return true
      }
      if (methodParameterClassType == Boolean::class.javaPrimitiveType && (argumentClassType == java.lang.Boolean::class.java || argumentClassType == Boolean::class.java)) {
        return true
      } else if (methodParameterClassType == Byte::class.javaPrimitiveType && (argumentClassType == java.lang.Byte::class.java || argumentClassType == Byte::class.java)) {
        return true
      } else if (methodParameterClassType == Char::class.javaPrimitiveType && (argumentClassType == java.lang.Character::class.java || argumentClassType == Char::class.java)) {
        return true
      } else if (methodParameterClassType == Float::class.javaPrimitiveType && (argumentClassType == java.lang.Float::class.java || argumentClassType == Float::class.java)) {
        return true
      } else if (methodParameterClassType == Int::class.javaPrimitiveType && (argumentClassType == java.lang.Integer::class.java || argumentClassType == Int::class.java)) {
        return true
      } else if (methodParameterClassType == Long::class.javaPrimitiveType && (argumentClassType == java.lang.Long::class.java || argumentClassType == Long::class.java)) {
        return true
      } else if (methodParameterClassType == Short::class.javaPrimitiveType && (argumentClassType == java.lang.Short::class.java || argumentClassType == Short::class.java)) {
        return true
      } else if (methodParameterClassType == Double::class.javaPrimitiveType && (argumentClassType == java.lang.Double::class.java || argumentClassType == Double::class.java)) {
        return true
      }
      return false
    }

    // Allow types that are too specific so that we don't have to specify exact classes
    @Throws(NoSuchMethodException::class)
    private fun getConstructorWithArgumentClassTypes(clazz: Class<*>?, vararg argumentClassTypes: Class<*>?): Constructor<*> {
      val constructors = clazz!!.constructors
      for (i in constructors.indices) {
        val constructor = constructors[i]
        val currentConstructorParameterTypes = constructor.parameterTypes
        if (currentConstructorParameterTypes.size != argumentClassTypes.size) {
          continue
        }
        var isValid = true
        for (j in currentConstructorParameterTypes.indices) {
          if (!isAssignableFrom(currentConstructorParameterTypes[j], argumentClassTypes[j])) {
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
