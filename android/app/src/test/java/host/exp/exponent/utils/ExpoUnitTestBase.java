package host.exp.exponent.utils;

import android.app.Application;
import android.content.Context;

import org.junit.Rule;
import org.mockito.Matchers;
import org.mockito.Mock;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.junit.MockitoJUnit;
import org.mockito.junit.MockitoRule;
import org.mockito.stubbing.Answer;

import java.io.File;

import host.exp.exponent.Constants;
import host.exp.exponent.ExpoHandler;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.kernel.Crypto;
import host.exp.exponent.network.ExponentNetwork;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.expoview.Exponent;

import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;

public class ExpoUnitTestBase {

  @Rule
  public MockitoRule rule = MockitoJUnit.rule();

  @Mock
  protected Context mContext;

  @Mock
  protected Application mApplication;

  @Mock
  protected ExpoHandler mExpoHandler;

  protected ExponentNetwork mExponentNetwork = mock(ExponentNetwork.class);

  @Mock
  protected Crypto mCrypto;

  protected ExponentSharedPreferences mExponentSharedPreferences = mock(ExponentSharedPreferences.class);
  protected ExponentManifest mExponentManifest = new ExponentManifest(null, mExponentNetwork, mCrypto, mExponentSharedPreferences);

  protected void baseBefore() {
    Constants.setInTest();
    doAnswer(new Answer<Void>() {
      @Override
      public Void answer(InvocationOnMock invocation) throws Throwable {
        Runnable runnable = invocation.getArgumentAt(0, Runnable.class);
        runnable.run();
        return null;
      }
    }).when(mExpoHandler).post(Matchers.any(Runnable.class));

    final File mockFsDirectory = new File("mockFsDirectory");
    mockFsDirectory.mkdir();
    doReturn(mockFsDirectory).when(mContext).getFilesDir();

    MockExpoDI.initialize();
    MockExpoDI.addMock(mContext, mApplication, mExpoHandler, mExponentNetwork, mCrypto, mExponentSharedPreferences, mExponentManifest);
    Exponent.initialize(mContext, mApplication);
  }
}
