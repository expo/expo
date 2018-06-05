package host.exp.exponent.utils;

import org.mockito.Matchers;
import org.mockito.MockSettings;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;

import java.io.IOException;

import expolib_v1.okhttp3.Request;
import expolib_v1.okhttp3.Response;
import host.exp.exponent.network.ExpoHttpCallback;
import host.exp.exponent.network.ExponentHttpClient;
import host.exp.exponent.network.ManualExpoResponse;

import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.withSettings;

public class MockExpoHttpClient {

  private ExponentHttpClient mClient;

  public MockExpoHttpClient() {
    this(false);
  }

  public ExponentHttpClient build() {
    return mClient;
  }

  public MockExpoHttpClient(final boolean verbose) {
    MockSettings settings = withSettings();
    if (verbose) {
      settings = settings.verboseLogging();
    }

    mClient = mock(ExponentHttpClient.class, settings);

    doAnswer(new Answer<Void>() {
      @Override
      public Void answer(InvocationOnMock invocation) throws Throwable {
        throw new RuntimeException("ExponentHttpClient.call called");
      }
    }).when(mClient).call(Matchers.any(Request.class), Matchers.any(ExpoHttpCallback.class));
  }

  public MockExpoHttpClient tryForcedCachedResponse(final MockManifest manifest) {
    doAnswer(new Answer<Void>() {
      @Override
      public Void answer(InvocationOnMock invocation) throws Throwable {
        ExponentHttpClient.SafeCallback safeCallback = invocation.getArgumentAt(2, ExponentHttpClient.SafeCallback.class);

        ManualExpoResponse response = new ManualExpoResponse();
        response.setBody(manifest.toString());
        safeCallback.onCachedResponse(response, true);

        return null;
      }
    }).when(mClient).tryForcedCachedResponse(Matchers.anyString(), Matchers.any(Request.class), Matchers.any(ExponentHttpClient.SafeCallback.class), Matchers.any(Response.class), Matchers.any(IOException.class));

    return this;
  }

  public MockExpoHttpClient callDefaultCache(final MockManifest manifest) {
    doAnswer(new Answer<Void>() {
      @Override
      public Void answer(InvocationOnMock invocation) throws Throwable {
        ExponentHttpClient.SafeCallback safeCallback = invocation.getArgumentAt(2, ExponentHttpClient.SafeCallback.class);

        ManualExpoResponse response = new ManualExpoResponse();
        response.setBody(manifest.toString());
        safeCallback.onCachedResponse(response, true);

        return null;
      }
    }).when(mClient).callDefaultCache(Matchers.any(Request.class), Matchers.any(ExponentHttpClient.SafeCallback.class));

    return this;
  }

  public MockExpoHttpClient callSafe(final MockManifest manifest) {
    doAnswer(new Answer<Void>() {
      @Override
      public Void answer(InvocationOnMock invocation) throws Throwable {
        ExponentHttpClient.SafeCallback safeCallback = invocation.getArgumentAt(1, ExponentHttpClient.SafeCallback.class);

        ManualExpoResponse response = new ManualExpoResponse();
        response.setBody(manifest.toString());
        safeCallback.onCachedResponse(response, true);

        return null;
      }
    }).when(mClient).callSafe(Matchers.any(Request.class), Matchers.any(ExponentHttpClient.SafeCallback.class));


    return this;
  }

  public MockExpoHttpClient getHardCodedResponse(final MockManifest manifest) {
    doAnswer(new Answer<String>() {
      @Override
      public String answer(InvocationOnMock invocation) throws Throwable {
        return manifest.toString();
      }
    }).when(mClient).getHardCodedResponse(Matchers.anyString());

    return this;
  }
}
