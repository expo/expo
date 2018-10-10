package expo.modules.payments.stripe.util;

public interface Action<T> {
  void call(T t);
}
