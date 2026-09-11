import { Picker } from '@react-native-picker/picker';
import { Platform, useEvent } from 'expo';
import { useVideoPlayer, VideoView, VideoSource, VideoSize, VideoTrack } from 'expo-video';
import React, { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import ConsoleBox from '../../components/ConsoleBox';
import { bigBuckBunnySource, dashSource, hlsSource } from './videoSources';
import { styles } from './videoStyles';
const videoLabels = ['Big Buck Bunny', 'Tears Of Steel (HLS)', 'Tears Of Steel (DASH)'];
const videoSources: VideoSource[] = [bigBuckBunnySource, hlsSource, dashSource];

type MaxResolutionOption = {
  label: string;
  size: VideoSize | null;
};

export default function VideoTracksScreen() {
  const ref = useRef<VideoView>(null);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [maxResolutionIndex, setMaxResolutionIndex] = useState(0);

  const player = useVideoPlayer(videoSources[0], (player) => {
    player.play();
    player.loop = true;
    player.muted = true;
  });

  const { videoTrack } = useEvent(player, 'videoTrackChange', { videoTrack: player.videoTrack });
  const { availableVideoTracks } = useEvent(player, 'sourceLoad', {
    videoSource: null,
    duration: player.duration,
    availableVideoTracks: player.availableVideoTracks,
    availableSubtitleTracks: player.availableSubtitleTracks,
    availableAudioTracks: player.availableAudioTracks,
  });

  const maxResolutionOptions = React.useMemo<MaxResolutionOption[]>(() => {
    const seen = new Set<string>();
    const trackOptions = availableVideoTracks
      .map((track) => track.size)
      .filter((size): size is VideoSize => size != null && size.width > 0 && size.height > 0)
      .filter((size) => {
        const key = `${size.width}x${size.height}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      })
      .sort((a, b) => b.height - a.height)
      .map((size) => ({ label: `${size.width}×${size.height}`, size }));
    return [{ label: 'No limit', size: null }, ...trackOptions];
  }, [availableVideoTracks]);

  const optionsKey = maxResolutionOptions.map((option) => option.label).join(',');
  React.useEffect(() => {
    setMaxResolutionIndex(0);
    player.maxResolution = null;
  }, [optionsKey, player]);

  return (
    <View style={styles.contentContainer}>
      <VideoView
        ref={ref}
        style={styles.video}
        player={player}
        contentFit="contain"
        contentPosition={{ dx: 0, dy: 0 }}
        showsTimecodes={false}
      />
      <ScrollView style={styles.controlsContainer}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text>VideoSource:</Text>
            <Picker
              itemStyle={Platform.OS === 'ios' && { height: 150 }}
              style={styles.picker}
              mode="dropdown"
              selectedValue={currentSourceIndex}
              onValueChange={async (value: number) => {
                setCurrentSourceIndex(value);
                await player.replaceAsync(videoSources[value]);
              }}>
              {videoSources.map((source, index) => (
                <Picker.Item key={index} label={videoLabels[index]} value={index} />
              ))}
            </Picker>
          </View>

          <View style={{ flex: 1 }}>
            <Text>Max resolution:</Text>
            <Picker
              itemStyle={Platform.OS === 'ios' && { height: 150 }}
              style={styles.picker}
              mode="dropdown"
              selectedValue={maxResolutionIndex}
              onValueChange={(value: number) => {
                setMaxResolutionIndex(value);
                player.maxResolution = maxResolutionOptions[value]?.size ?? null;
              }}>
              {maxResolutionOptions.map((option, index) => (
                <Picker.Item key={option.label} label={option.label} value={index} />
              ))}
            </Picker>
          </View>
        </View>

        <Text style={styles.switchTitle}>Current Video Track:</Text>
        <ConsoleBox>{videoTrackToString(videoTrack)}</ConsoleBox>

        <Text style={styles.switchTitle}>Available Video Tracks:</Text>
        <ConsoleBox>{videoTracksToString(availableVideoTracks)}</ConsoleBox>
      </ScrollView>
    </View>
  );
}

function videoTrackToString(track: VideoTrack | null) {
  if (!track) {
    return 'null';
  }
  return (
    `{\n` +
    `\tid: "${track.id}",\n` +
    `\tsize: "${track.size.width}x${track.size.height}",\n` +
    `\tbitrate: ${track.bitrate},\n` +
    `\tframe rate: ${track.frameRate},\n` +
    `\tmimeType: "${track.mimeType}",\n` +
    `\tisSupported: ${track.isSupported}\n` +
    `}`
  );
}

function videoTracksToString(tracks: VideoTrack[]) {
  if (tracks.length === 0) {
    return '[]';
  }
  let result = '[';
  for (const track of tracks) {
    result += ` \n\t{size: "${track.size.width}x${track.size.height}", bitrate: ${track.bitrate}, mimeType: "${track.mimeType}", isSupported: ${track.isSupported}, id: "${track.id}"}`;
  }
  return result + ' \n]';
}
