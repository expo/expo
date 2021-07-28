package expo.modules.core.interfaces;

import java.lang.annotation.Retention;

import static java.lang.annotation.RetentionPolicy.RUNTIME;

/**
 * Methods annotated with {@link ExpoMethod} will get exported to client code realm.
 */
@Retention(RUNTIME)
public @interface ExpoMethod {
}
