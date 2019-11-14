package expo.modules.av.player;

import android.os.Bundle;
import androidx.annotation.NonNull;
import android.widget.MediaController;

public class PlayerDataControl implements MediaController.MediaPlayerControl {
  private final PlayerData mPlayerData;

  public PlayerDataControl(final @NonNull PlayerData playerData) {
    mPlayerData = playerData;
  }

  @Override
  public void start() {
    final Bundle map = new Bundle();
    map.putBoolean(PlayerData.STATUS_SHOULD_PLAY_KEY_PATH, true);
    mPlayerData.setStatus(map, null);
  }

  @Override
  public void pause() {
    final Bundle map = new Bundle();
    map.putBoolean(PlayerData.STATUS_SHOULD_PLAY_KEY_PATH, false);
    mPlayerData.setStatus(map, null);
  }

  @Override
  public int getDuration() {
    final Bundle status = mPlayerData.getStatus();
    return (status.getBoolean(PlayerData.STATUS_IS_LOADED_KEY_PATH)
        && status.containsKey(PlayerData.STATUS_DURATION_MILLIS_KEY_PATH))
        ? status.getInt(PlayerData.STATUS_DURATION_MILLIS_KEY_PATH) : 0;
  }

  @Override
  public int getCurrentPosition() {
    final Bundle status = mPlayerData.getStatus();
    return status.getBoolean(PlayerData.STATUS_IS_LOADED_KEY_PATH)
        ? status.getInt(PlayerData.STATUS_POSITION_MILLIS_KEY_PATH) : 0;
  }

  @Override
  public void seekTo(final int msec) {
    final Bundle map = new Bundle();
    map.putDouble(PlayerData.STATUS_POSITION_MILLIS_KEY_PATH, (double) msec);
    mPlayerData.setStatus(map, null);
  }

  @Override
  public boolean isPlaying() {
    final Bundle status = mPlayerData.getStatus();
    return status.getBoolean(PlayerData.STATUS_IS_LOADED_KEY_PATH)
        && status.getBoolean(PlayerData.STATUS_IS_PLAYING_KEY_PATH);
  }

  @Override
  public int getBufferPercentage() {
    final Bundle status = mPlayerData.getStatus();
    if (status.getBoolean(PlayerData.STATUS_IS_LOADED_KEY_PATH)
        && status.containsKey(PlayerData.STATUS_DURATION_MILLIS_KEY_PATH)
        && status.containsKey(PlayerData.STATUS_PLAYABLE_DURATION_MILLIS_KEY_PATH)) {
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
