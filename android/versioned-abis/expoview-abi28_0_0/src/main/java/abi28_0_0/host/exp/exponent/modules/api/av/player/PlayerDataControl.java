package abi28_0_0.host.exp.exponent.modules.api.av.player;

import android.support.annotation.NonNull;
import android.widget.MediaController;

import abi28_0_0.com.facebook.react.bridge.Arguments;
import abi28_0_0.com.facebook.react.bridge.ReadableMap;
import abi28_0_0.com.facebook.react.bridge.WritableMap;

public class PlayerDataControl implements MediaController.MediaPlayerControl {
  private final PlayerData mPlayerData;
  
  public PlayerDataControl(final @NonNull PlayerData playerData) {
    mPlayerData = playerData;
  }

  @Override
  public void start() {
    final WritableMap map = Arguments.createMap();
    map.putBoolean(PlayerData.STATUS_SHOULD_PLAY_KEY_PATH, true);
    mPlayerData.setStatus(map, null);
  }

  @Override
  public void pause() {
    final WritableMap map = Arguments.createMap();
    map.putBoolean(PlayerData.STATUS_SHOULD_PLAY_KEY_PATH, false);
    mPlayerData.setStatus(map, null);
  }

  @Override
  public int getDuration() {
    final ReadableMap status = mPlayerData.getStatus();
    return (status.getBoolean(PlayerData.STATUS_IS_LOADED_KEY_PATH)
        && status.hasKey(PlayerData.STATUS_DURATION_MILLIS_KEY_PATH))
        ? status.getInt(PlayerData.STATUS_DURATION_MILLIS_KEY_PATH) : 0;
  }

  @Override
  public int getCurrentPosition() {
    final ReadableMap status = mPlayerData.getStatus();
    return status.getBoolean(PlayerData.STATUS_IS_LOADED_KEY_PATH)
        ? status.getInt(PlayerData.STATUS_POSITION_MILLIS_KEY_PATH) : 0;
  }

  @Override
  public void seekTo(final int msec) {
    final WritableMap map = Arguments.createMap();
    map.putDouble(PlayerData.STATUS_POSITION_MILLIS_KEY_PATH, msec);
    mPlayerData.setStatus(map, null);
  }

  @Override
  public boolean isPlaying() {
    final ReadableMap status = mPlayerData.getStatus();
    return status.getBoolean(PlayerData.STATUS_IS_LOADED_KEY_PATH)
        && status.getBoolean(PlayerData.STATUS_IS_PLAYING_KEY_PATH);
  }

  @Override
  public int getBufferPercentage() {
    final ReadableMap status = mPlayerData.getStatus();
    if (status.getBoolean(PlayerData.STATUS_IS_LOADED_KEY_PATH)
        && status.hasKey(PlayerData.STATUS_DURATION_MILLIS_KEY_PATH)
        && status.hasKey(PlayerData.STATUS_PLAYABLE_DURATION_MILLIS_KEY_PATH)) {
      final double duration = status.getInt(PlayerData.STATUS_DURATION_MILLIS_KEY_PATH);
      final double playableDuration = status.getInt(PlayerData.STATUS_PLAYABLE_DURATION_MILLIS_KEY_PATH);
      return (int) (playableDuration / duration * 100.0);
    } else {
      return 0;
    }
  }

  @Override
  public boolean canPause() {
    return true;
  }

  @Override
  public boolean canSeekBackward() {
    return true;
  }

  @Override
  public boolean canSeekForward() {
    return true;
  }

  @Override
  public int getAudioSessionId() {
    return mPlayerData.getAudioSessionId();
  }

  public boolean isFullscreen() {
    return mPlayerData.isPresentedFullscreen();
  }

  public void toggleFullscreen() {
    mPlayerData.toggleFullscreen();
  }
}
