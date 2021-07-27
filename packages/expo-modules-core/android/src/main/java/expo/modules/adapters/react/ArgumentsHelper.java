package expo.modules.adapters.react;

import com.facebook.react.bridge.Dynamic;

import expo.modules.core.arguments.MapArguments;
import expo.modules.core.arguments.ReadableArguments;

public class ArgumentsHelper {
  public static Object getNativeArgumentForExpectedClass(Dynamic argument, Class<?> expectedArgumentClass) {
    switch (argument.getType()) {
      case String:
        return argument.asString();
      case Map:
        if (expectedArgumentClass.isAssignableFrom(ReadableArguments.class)) {
          return new MapArguments(argument.asMap().toHashMap());
        }
        return argument.asMap().toHashMap();
      case Array:
        return argument.asArray().toArrayList();
      case Number:
        // Argument of type .Number is remembered as Double by default.
        Double doubleArgument = argument.asDouble();
        // We have to provide ExportedModule with proper Number value
        if (expectedArgumentClass == byte.class || expectedArgumentClass == Byte.class) {
          return doubleArgument.byteValue();
        } else if (expectedArgumentClass == short.class || expectedArgumentClass == Short.class) {
          return doubleArgument.shortValue();
        } else if (expectedArgumentClass == int.class || expectedArgumentClass == Integer.class) {
          return doubleArgument.intValue();
        } else if (expectedArgumentClass == float.class || expectedArgumentClass == Float.class) {
          return doubleArgument.floatValue();
        } else if (expectedArgumentClass == long.class || expectedArgumentClass == Long.class) {
          return doubleArgument.longValue();
        } else {
          return doubleArgument;
        }
      case Boolean:
        return argument.asBoolean();
      case Null:
        return null;
      default:
        // JS argument is not null, however we can't recognize the type.
        throw new RuntimeException(
            "Don't know how to convert React Native argument of type " + argument.getType() + " to native."
        );
    }
  }
}
