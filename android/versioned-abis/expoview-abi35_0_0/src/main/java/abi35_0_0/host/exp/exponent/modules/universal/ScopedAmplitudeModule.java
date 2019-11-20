package abi35_0_0.host.exp.exponent.modules.universal;

import android.content.Context;

import com.amplitude.api.AmplitudeClient;

import java.io.UnsupportedEncodingException;

import abi35_0_0.expo.modules.analytics.amplitude.AmplitudeModule;
import host.exp.exponent.kernel.ExperienceId;

public class ScopedAmplitudeModule extends AmplitudeModule {
  private String mExperienceKey;

  public ScopedAmplitudeModule(Context context, ExperienceId experienceId) {
    super(context);
    try {
      mExperienceKey = experienceId.getUrlEncoded();
    } catch (UnsupportedEncodingException e) {
      mExperienceKey = Integer.toString(experienceId.hashCode());
    }
  }

  @Override
  protected AmplitudeClient getClient(String apiKey) {
    return new AmplitudeClient(mExperienceKey + "#" + apiKey);
  }
}
