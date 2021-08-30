package expo.modules.structuredheaders;

/**
 * Compat version of {@link java.util.function.LongSupplier}
 */
public interface LongSupplier {

  /**
   * Gets a result.
   *
   * @return a result
   */
  long getAsLong();
}
