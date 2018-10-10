package expo.core;

public class ArgumentsHelper {
  /* package */ static Object validatedArgumentForClass(Object argument, Class<?> expectedArgumentClass) {
    if (Object.class.isAssignableFrom(expectedArgumentClass)) {
      // Expected argument class is an Object descendant
      if (argument != null) {
        // Actual argument is not null, so we can check whether
        // its class matches expectation.
        Class<?> actualArgumentClass = argument.getClass();

        if (!expectedArgumentClass.isAssignableFrom(actualArgumentClass)) {
          // Expected argument class is not assignable from actual argument class
          // i. e. eg. Map was provided for a String argument.
          throw new IllegalArgumentException(
                  "Argument of an incompatible class: " + actualArgumentClass
                          + " cannot be passed as an argument to parameter expecting " + expectedArgumentClass + ".");
        }
      }
    } else {
      // Argument is of primitive type, like boolean or int.
      if (argument == null) {
        throw new IllegalArgumentException(
                "Argument null cannot be passed to an argument to parameter expecting " + expectedArgumentClass + ".");
      }

      Class<?> actualArgumentClass = argument.getClass();
      if (expectedArgumentClass != actualArgumentClass) {
        if (!Number.class.isAssignableFrom(actualArgumentClass) && !Boolean.class.isAssignableFrom(actualArgumentClass)) {
          throw new IllegalArgumentException("Argument of an incompatible class: "
                  + actualArgumentClass + " cannot be passed as an argument to parameter expecting " + expectedArgumentClass + ".");
        }

        // Otherwise the expected argument is of type int or long or booealn and actual argument class is a descendant of Number or Boolean.
        // We believe that platform adapter has coerced the value correctly and when expected argument
        // is int, actual argument is Integer; when expected is float, actual is Float, etc.
        // If it's not, Java will throw a developer-readable exception.
      }
    }

    // All checks passed
    return argument;
  }
}
