package abi40_0_0.host.exp.exponent.modules.universal;

import android.content.Context;

import com.amplitude.api.AmplitudeClient;

import java.io.UnsupportedEncodingException;

import abi40_0_0.expo.modules.analytics.amplitude.AmplitudeModule;
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
    // 1. Explicitly not using Amplitude.getInstance(String key) here.
    //    It reuses AmplitudeClient instances, so calling #initialize()
    //    a second time wouldn't reinitialize the client.
    // 2. Scoping by both experienceId and apiKey lets users log events
    //    to more than one app in one experience. Moreover, the underlying
    //    database isn't cleared when initializing, so scoping by:
    //     - only experienceId would mix saved preferences for other Amplitude apps,
    //     - only apiKey would mix saved preferences for one Amplitude app between experiences.
    return new AmplitudeClient(mExperienceKey + "#" + apiKey);
  }
}
