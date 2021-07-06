// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

import host.exp.exponent.analytics.EXL;
import host.exp.expoview.BuildConfig;

// TODO: add type checking in DEBUG
public class RNObject {

  private static final String TAG = RNObject.class.getSimpleName();

  public static final String UNVERSIONED = "UNVERSIONED";

  private final String mClassName; // Unversioned
  private Class mClazz; // Versioned
  private Object mInstance; // Versioned

  // We ignore the version of clazz
  public RNObject(Class clazz) {
    mClassName = removeVersionFromClass(clazz);
  }

  public RNObject(String className) {
    mClassName = className;
  }

  public static RNObject wrap(Object object) {
    return new RNObject(object);
  }

  private RNObject(Object object) {
    assign(object);
    mClassName = removeVersionFromClass(mClazz);
  }

  public boolean isNull() {
    return mInstance == null;
  }

  public boolean isNotNull() {
    return mInstance != null;
  }

  @SuppressWarnings("ConstantConditions")   // required for "unversioned" flavor check
  public RNObject loadVersion(String version) {
    try {

      if (version.equals(UNVERSIONED) || BuildConfig.FLAVOR.equals("unversioned")) {
        if (mClassName.startsWith("host.exp.exponent")) {
          mClazz = Class.forName("versioned." + mClassName);
        } else {
          mClazz = Class.forName(mClassName);
        }
      } else {
        mClazz = Class.forName("abi" + version.replace('.', '_') + '.' + mClassName);
      }
    } catch (ClassNotFoundException e) {
      EXL.e(TAG, e);
    }

    return this;
  }

  public void assign(Object object) {
    if (object != null) {
      mClazz = object.getClass();
    }
    mInstance = object;
  }

  public Object get() {
    return mInstance;
  }

  public Class rnClass() {
    return mClazz;
  }

  public String version() {
    String versionedClassName = mClazz.getName();
    if (versionedClassName.startsWith("abi")) {
      String abiVersion = versionedClassName.split("\\.")[0];
      return abiVersion.substring(3);
    } else {
      return UNVERSIONED;
    }
  }

  public static Object versionedEnum(String sdkVersion, String clazz, String value) {
    try {
      return new RNObject(clazz).loadVersion(sdkVersion).rnClass().getDeclaredField(value).get(null);
    } catch (IllegalAccessException | NoSuchFieldException e) {
      EXL.e(TAG, e);
      throw new IllegalStateException("Unable to create enum: " + clazz + "." + "value", e);
    }
  }

  public static String versionForClassname(final String classname) {
    if (classname.startsWith("abi")) {
      String abiVersion = classname.split("\\.")[0];
      return abiVersion.substring(3);
    } else {
      return UNVERSIONED;
    }
  }

  public RNObject construct(Object... args) {
    try {
      mInstance = getConstructorWithTypes(mClazz, objectsToClasses(args)).newInstance(args);
    } catch (NoSuchMethodException | InvocationTargetException | InstantiationException | IllegalAccessException e) {
      EXL.e(TAG, e);
    }
    return this;
  }

  public Object call(String name, Object... args) {
    return callWithReceiver(mInstance, name, args);
  }

  public RNObject callRecursive(String name, Object... args) {
    Object result = call(name, args);
    if (result == null) {
      return null;
    }
    return RNObject.wrap(result);
  }

  public Object callStatic(String name, Object... args) {
    return callWithReceiver(null, name, args);
  }

  public RNObject callStaticRecursive(String name, Object... args) {
    return RNObject.wrap(callStatic(name, args));
  }

  public void setField(String name, Object value) {
    setFieldWithReceiver(mInstance, name, value);
  }

  public void setStaticField(String name, Object value) {
    setFieldWithReceiver(null, name, value);
  }

  private String removeVersionFromClass(Class clazz) {
    String name = clazz.getName();
    if (name.startsWith("abi")) {
      return name.substring(name.indexOf('.') + 1);
    }

    return name;
  }

  private Class[] objectsToClasses(Object... objects) {
    Class[] classes = new Class[objects.length];
    for (int i = 0; i < objects.length; i++) {
      if (objects[i] != null) {
        classes[i] = objects[i].getClass();
      }
    }

    return classes;
  }

  public Object callWithReceiver(Object receiver, String name, Object... args) {
    try {
      return getMethodWithTypes(mClazz, name, objectsToClasses(args)).invoke(receiver, args);
    } catch (IllegalAccessException | InvocationTargetException | NoSuchMethodException | NoSuchMethodError e) {
      EXL.e(TAG, e);
      e.printStackTrace();
    } catch (Throwable e) {
      EXL.e(TAG, "Runtime exception in RNObject when calling method " + name + ": " + e.toString());
    }

    return null;
  }

  public void setFieldWithReceiver(Object receiver, String name, Object value) {
    try {
      getFieldWithType(mClazz, name, value.getClass()).set(receiver, value);
    } catch (IllegalAccessException | NoSuchFieldException | NoSuchMethodError e) {
      EXL.e(TAG, e);
      e.printStackTrace();
    } catch (Throwable e) {
      EXL.e(TAG, "Runtime exception in RNObject when setting field " + name + ": " + e.toString());
    }
  }

  // Allow types that are too specific so that we don't have to specify exact classes
  private Method getMethodWithTypes(Class clazz, String name, Class... types) throws NoSuchMethodException {
    Method[] methods = clazz.getMethods();
    for (int i = 0; i < methods.length; i++) {
      Method method = methods[i];
      if (!method.getName().equals(name)) {
        continue;
      }

      Class[] currentMethodTypes = method.getParameterTypes();
      if (currentMethodTypes.length != types.length) {
        continue;
      }

      boolean isValid = true;
      for (int j = 0; j < currentMethodTypes.length; j++) {
        if (!isAssignableFrom(currentMethodTypes[j], types[j])) {
          isValid = false;
          break;
        }
      }

      if (!isValid) {
        continue;
      }

      return method;
    }

    throw new NoSuchMethodException();
  }

  private Field getFieldWithType(Class clazz, String name, Class type) throws NoSuchFieldException {
    Field[] fields = clazz.getFields();
    for (int i = 0; i < fields.length; i++) {
      Field field = fields[i];
      if (!field.getName().equals(name)) {
        continue;
      }

      Class currentFieldType = field.getType();

      if (isAssignableFrom(currentFieldType, type)) {
        return field;
      }
    }

    throw new NoSuchFieldException();
  }

  // Allow types that are too specific so that we don't have to specify exact classes
  private Constructor getConstructorWithTypes(Class clazz, Class... types) throws NoSuchMethodException {
    Constructor[] constructors = clazz.getConstructors();
    for (int i = 0; i < constructors.length; i++) {
      Constructor constructor = constructors[i];
      Class[] currentConstructorTypes = constructor.getParameterTypes();
      if (currentConstructorTypes.length != types.length) {
        continue;
      }

      boolean isValid = true;
      for (int j = 0; j < currentConstructorTypes.length; j++) {
        if (!isAssignableFrom(currentConstructorTypes[j], types[j])) {
          isValid = false;
          break;
        }
      }

      if (!isValid) {
        continue;
      }

      return constructor;
    }

    throw new NoSuchMethodError();
  }

  // Allow boxed -> unboxed assignments
  private boolean isAssignableFrom(Class c1, Class c2) {
    if (c2 == null) {
      // There's not really a good way to handle this.
      return true;
    }

    if (c1.isAssignableFrom(c2)) {
      return true;
    }

    if (c1.equals(boolean.class) && c2.equals(Boolean.class)) {
      return true;
    } else if (c1.equals(byte.class) && c2.equals(Byte.class)) {
      return true;
    } else if (c1.equals(char.class) && c2.equals(Character.class)) {
      return true;
    } else if (c1.equals(float.class) && c2.equals(Float.class)) {
      return true;
    } else if (c1.equals(int.class) && c2.equals(Integer.class)) {
      return true;
    } else if (c1.equals(long.class) && c2.equals(Long.class)) {
      return true;
    } else if (c1.equals(short.class) && c2.equals(Short.class)) {
      return true;
    } else if (c1.equals(double.class) && c2.equals(Double.class)) {
      return true;
    }

    return false;
  }

  public void onHostResume(Object one, Object two) {
    this.call("onHostResume", one, two);
  }

  public void onHostPause() {
    this.call("onHostPause");
  }

  public void onHostDestroy() {
    this.call("onHostDestroy");
  }
}
