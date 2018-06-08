package host.exp.exponent.utils;

import org.mockito.Matchers;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;

import javax.inject.Inject;

import host.exp.exponent.di.NativeModuleDepsProvider;

import static org.mockito.Mockito.*;

/*
 * Modified NativeModuleDepsProvider to inject mocks
 */
public class MockExpoDI {

  static final String ENHANCER = "$$EnhancerByMockitoWithCGLIB$$";

  // Use this instead of .getClass because mockito wraps our classes
  static Class<? extends Object> typeOf(Object instance) {
    Class<? extends Object> type = instance.getClass();
    while(type.getSimpleName().contains(ENHANCER)) {
      type = type.getSuperclass();
    }

    return type;
  }

  private static Map<Class, Object> sClassesToInjectedObjects = new HashMap<>();

  public static void clearMocks() {
    sClassesToInjectedObjects = new HashMap<>();
  }

  public static void addMock(Object... objects) {
    for (Object object : objects) {
      sClassesToInjectedObjects.put(typeOf(object), object);
    }
  }

  public static void initialize() {
    NativeModuleDepsProvider mockInstance = mock(NativeModuleDepsProvider.class);
    doAnswer(new Answer<Void>() {
      @Override
      public Void answer(InvocationOnMock invocation) throws Throwable {
        Object[] args = invocation.getArguments();

        inject((Class) args[0], args[1]);

        return null;
      }
    }).when(mockInstance).inject(Matchers.any(Class.class), Matchers.any());

    NativeModuleDepsProvider.setTestInstance(mockInstance);
  }

  private static void inject(Class clazz, Object object) {
    for (Field field : clazz.getDeclaredFields()) {
      injectField(object, field);
    }
  }

  private static void injectField(Object object, Field field) {
    if (field.isAnnotationPresent(Inject.class)) {
      Class fieldClazz = field.getType();
      if (!sClassesToInjectedObjects.containsKey(fieldClazz)) {
        throw new RuntimeException("Mocked NativeModuleDepsProvider could not find object for class " + fieldClazz.toString());
      }

      Object fieldObject = sClassesToInjectedObjects.get(fieldClazz);
      try {
        field.setAccessible(true);
        field.set(object, fieldObject);
      } catch (IllegalAccessException e) {
        throw new RuntimeException(e);
      }
    }
  }
}
