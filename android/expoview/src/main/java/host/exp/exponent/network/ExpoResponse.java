package host.exp.exponent.network;

public interface ExpoResponse {

  boolean isSuccessful();
  ExpoBody body();
  int code();
  ExpoHeaders headers();
  ExpoResponse networkResponse();
}
