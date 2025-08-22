import Entypo from '@expo/vector-icons/Entypo';
import { FlashList } from '@shopify/flash-list';
import { VideoView, VideoSource, useVideoPlayer } from 'expo-video';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { styles, ViewSize } from './VideoFlatListScreen';
import {
  bigBuckBunnySource,
  elephantsDreamSource,
  hlsSource,
  localVideoSource,
} from './videoSources';

const videoSources = Array(20)
  .fill([localVideoSource, bigBuckBunnySource, elephantsDreamSource, hlsSource])
  .flat();

type RenderItemProps = {
  item: VideoSource;
  index: number;
  viewSize: ViewSize;
  visibleIndex: number;
};

function RenderItem({ item, index, viewSize, visibleIndex }: RenderItemProps) {
  const [heart, setHeart] = useState(false);
  // We don't pass the item directly into the player, when the item changes in the argument
  // the video player is re-created, which is slow
  const player = useVideoPlayer(null, (player) => {
    player.bufferOptions = {
      preferredForwardBufferDuration: 5,
    };
    player.loop = true;
    player.pause();
  });

  // Instead, we use the replace function
  useEffect(() => {
    (async () => {
      await player.replaceAsync(item);
      player.currentTime = 10;
    })();
  }, [index]);

  useEffect(() => {
    if (visibleIndex === index) {
      player.play();
    } else {
      player.pause();
    }
  }, [visibleIndex]);

  return (
    <View style={viewSize}>
      <VideoView
        player={player}
        style={styles.videoView}
        nativeControls={false}
        contentFit="contain"
        allowsVideoFrameAnalysis={false}
      />
      <View style={styles.overlayContainer}>
        <View style={styles.controlsContainer}>
          <Entypo
            name={heart ? 'heart' : 'heart-outlined'}
            size={50}
            color="white"
            onPress={() => {
              setHeart(!heart);
            }}
          />
          <Entypo name="message" size={50} color="white" />
          <Entypo name="upload-to-cloud" size={50} color="white" />
        </View>
      </View>
    </View>
  );
}

export default function VideoFlatListScreen() {
  const [viewSize, setViewSize] = useState<ViewSize | null>(null);
  const [visibleIndex, setVisibleIndex] = useState(0);

  return (
    <View
      style={styles.contentContainer}
      onLayout={(e) => {
        setViewSize(e.nativeEvent.layout);
      }}>
      {viewSize && (
        <FlashList
          data={videoSources}
          snapToInterval={viewSize.height}
          snapToAlignment="center"
          disableIntervalMomentum
          onViewableItemsChanged={({ viewableItems, changed }) => {
            const visible = viewableItems[0];
            const index = visible?.index;
            if (index != null) {
              setVisibleIndex(index);
            }
          }}
          viewabilityConfig={{
            itemVisiblePercentThreshold: 50,
            waitForInteraction: false,
          }}
          renderItem={({ item, index, extraData }) => (
            <RenderItem item={item} index={index} viewSize={viewSize} visibleIndex={extraData} />
          )}
          extraData={visibleIndex}
          decelerationRate={0.8}
          showsVerticalScrollIndicator={false}
          drawDistance={viewSize.height * 2}
        />
      )}
    </View>
  );
}
