package com.wix.invoke;

import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.reflect.MethodUtils;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

/**
 * Created by rotemm on 26/10/2016.
 */

public class MethodUtilsExt extends MethodUtils {

    public static Object invokeMethodEvenIfInaccessible(Object object, String methodName, Object... args) throws Exception {
        Method method = object.getClass().getDeclaredMethod(methodName);
        method.setAccessible(true);
        return method.invoke(object, args);
    }


    public static Object invokeExactMethodNoAutobox(final Object object, final String methodName, Object[] args) throws NoSuchMethodException, IllegalAccessException, InvocationTargetException {
        args = ArrayUtils.nullToEmpty(args);
        Class<?>[] parameterTypes = toClass(args);
        parameterTypes = ArrayUtils.nullToEmpty(parameterTypes);
        final Method method = getAccessibleMethod(object.getClass(), methodName, parameterTypes);
        if (method == null) {
            throw new NoSuchMethodException("No such accessible method: "
                    + methodName + "() on object: "
                    + object.getClass().getName());
        }
        return method.invoke(object, args);
    }

    public static Class<?>[] toClass(final Object... array) {
        if (array == null) {
            return null;
        } else if (array.length == 0) {
            return ArrayUtils.EMPTY_CLASS_ARRAY;
        }
        final Class<?>[] classes = new Class[array.length];
        for (int i = 0; i < array.length; i++) {
            Class clazz = array[i] == null ? null : array[i].getClass();
            if (Integer.class == clazz) {
                classes[i] = int.class;
            } else if (Double.class == clazz) {
                classes[i] = double.class;
            } else if (Float.class == clazz) {
                classes[i] = float.class;
            } else if (Boolean.class == clazz) {
                classes[i] = boolean.class;
            } else {
                classes[i] = clazz;
            }


        }
        return classes;
    }

}
