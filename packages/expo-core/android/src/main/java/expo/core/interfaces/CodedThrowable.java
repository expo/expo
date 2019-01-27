package expo.core.interfaces;

/**
 * Helper interface to make errors easier to handle. The promise.reject
 * implementation should know about this interface and be able to get the code
 * itself when passed an object which implements it.
 */

public interface CodedThrowable {
  String getCode();
  String getMessage();
}
