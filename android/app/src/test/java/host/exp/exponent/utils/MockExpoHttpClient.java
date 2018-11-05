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
import host.exp.exponent.network.ExponentNetwork;
import host.exp.exponent.network.ManualExpoResponse;

import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.withSettings;

/*
 * Generates an ExponentHttpClient that returns mocks
 */
public class MockExpoHttpClient {

  private ExponentHttpClient mClient;

  public MockExpoHttpClient() {
    this(false);
  }

  public void use(final ExponentNetwork exponentNetwork) {
    doAnswer(new Answer<ExponentHttpClient>() {
      @Override
      public ExponentHttpClient answer(InvocationOnMock invocation) throws Throwable {
        return mClient;
      }
    }).when(exponentNetwork).getClient();

    doAnswer(new Answer<ExponentHttpClient>() {
      @Override
      public ExponentHttpClient answer(InvocationOnMock invocation) throws Throwable {
        return mClient;
      }
    }).when(exponentNetwork).getLongTimeoutClient();
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

  public enum ResponseType {
    NORMAL,
    CACHED,
    EMBEDDED,
    FAILURE
  }

  private void handleSafeCallback(final ExponentHttpClient.SafeCallback safeCallback, final ResponseType type, final String body) {
    if (type != ResponseType.FAILURE) {
      ManualExpoResponse response = new ManualExpoResponse();
      response.setBody(body);

      if (type == ResponseType.NORMAL) {
        // If we're not loaded from cache we should have a network response
        response.setNetworkResponse(response);
        safeCallback.onResponse(response);
      } else if (type == ResponseType.CACHED) {
        safeCallback.onCachedResponse(response, false);
      } else {
        safeCallback.onCachedResponse(response, true);
      }
    } else {
      safeCallback.onFailure(new IOException(body));
    }
  }

  public MockExpoHttpClient tryForcedCachedResponse(final ResponseType type, final String body) {
    doAnswer(new Answer<Void>() {
      @Override
      public Void answer(InvocationOnMock invocation) throws Throwable {
        ExponentHttpClient.SafeCallback safeCallback = invocation.getArgumentAt(2, ExponentHttpClient.SafeCallback.class);

        handleSafeCallback(safeCallback, type, body);

        return null;
      }
    }).when(mClient).tryForcedCachedResponse(Matchers.anyString(), Matchers.any(Request.class), Matchers.any(ExponentHttpClient.SafeCallback.class), Matchers.any(Response.class), Matchers.any(IOException.class));

    return this;
  }

  public MockExpoHttpClient callDefaultCache(final ResponseType type, final String body) {
    doAnswer(new Answer<Void>() {
      @Override
      public Void answer(InvocationOnMock invocation) throws Throwable {
        ExponentHttpClient.SafeCallback safeCallback = invocation.getArgumentAt(2, ExponentHttpClient.SafeCallback.class);

        handleSafeCallback(safeCallback, type, body);

        return null;
      }
    }).when(mClient).callDefaultCache(Matchers.any(Request.class), Matchers.any(ExponentHttpClient.SafeCallback.class));

    return this;
  }

  public MockExpoHttpClient callSafe(final ResponseType type, final String body) {
    doAnswer(new Answer<Void>() {
      @Override
      public Void answer(InvocationOnMock invocation) throws Throwable {
        ExponentHttpClient.SafeCallback safeCallback = invocation.getArgumentAt(1, ExponentHttpClient.SafeCallback.class);

        handleSafeCallback(safeCallback, type, body);

        return null;
      }
    }).when(mClient).callSafe(Matchers.any(Request.class), Matchers.any(ExponentHttpClient.SafeCallback.class));


    return this;
  }

  public MockExpoHttpClient getHardCodedResponse(final String body) {
    doAnswer(new Answer<String>() {
      @Override
      public String answer(InvocationOnMock invocation) throws Throwable {
        return body;
      }
    }).when(mClient).getHardCodedResponse(Matchers.anyString());

    return this;
  }
}
