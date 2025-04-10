import AntDesign from '@expo/vector-icons/AntDesign';
import { VideoView, VideoPlayer, createVideoPlayer, VideoSource } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { localVideoSource } from './videoSources';

const videoSources = Array(100).fill(localVideoSource);

export type ViewSize = {
  width: number;
  height: number;
};

type RenderItemProps = {
  item: VideoSource;
  index: number;
  playerPool: VideoPlayer[];
  viewSize: ViewSize;
};

function createPlayerPool(size: number, setup?: (player: VideoPlayer) => void): VideoPlayer[] {
  return Array.from({ length: size }, () => {
    const player = createVideoPlayer(null);
    setup?.(player);
    return player;
  });
}

function RenderItem({ item, index, playerPool, viewSize }: RenderItemProps) {
  const player = playerPool[index % playerPool.length];
  const [heart, setHeart] = useState(false);

  useEffect(() => {
    player.replace(item);
  }, [playerPool]);

  return (
    <View style={viewSize}>
      <VideoView
        player={player}
        style={styles.videoView}
        nativeControls={false}
        contentFit="fill"
        allowsVideoFrameAnalysis={false}
      />
      <View style={styles.overlayContainer}>
        <View style={styles.controlsContainer}>
          <AntDesign
            name={heart ? 'heart' : 'hearto'}
            size={50}
            color="white"
            onPress={() => {
              setHeart(!heart);
            }}
          />
          <AntDesign name="message1" size={50} color="white" />
          <AntDesign name="cloudupload" size={50} color="white" />
        </View>
      </View>
    </View>
  );
}

export default function VideoFlatListScreen() {
  const [viewSize, setViewSize] = useState<ViewSize | null>(null);
  const playerPool = useRef<VideoPlayer[]>([]);

  useEffect(() => {
    playerPool.current = createPlayerPool(10, (player) => {
      player.bufferOptions = {
        preferredForwardBufferDuration: 5,
      };
      player.loop = true;
    });

    return () => {
      playerPool.current.forEach((player) => player.release());
      playerPool.current = [];
    };
  }, []);

  return (
    <View
      style={styles.contentContainer}
      onLayout={(e) => {
        setViewSize(e.nativeEvent.layout);
      }}>
      {viewSize && (
        <FlatList
          data={videoSources}
          snapToInterval={viewSize.height}
          snapToAlignment="center"
          disableIntervalMomentum
          onViewableItemsChanged={({ viewableItems, changed }) => {
            const visible = viewableItems[0];
            const index = visible?.index;
            if (index == null) {
              return;
            }

            const visiblePlayer = playerPool.current[index % playerPool.current.length];
            for (const player of playerPool.current) {
              if (visiblePlayer !== player && player.playing) {
                player.pause();
              }
            }

            visiblePlayer.play();
          }}
          viewabilityConfig={{
            itemVisiblePercentThreshold: 50,
            waitForInteraction: false,
          }}
          renderItem={({ item, index }) => (
            <RenderItem
              item={item}
              index={index}
              playerPool={playerPool.current}
              viewSize={viewSize}
            />
          )}
          removeClippedSubviews={false}
          decelerationRate={0.8}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          windowSize={10}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

export const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    alignSelf: 'stretch',
  },
  controlsContainer: {
    marginBottom: 50,
    marginRight: 25,
    justifyContent: 'space-around',
    height: 200,
  },
  videoView: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
});
