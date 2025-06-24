import { Link } from 'expo-router';
import React from 'react';
import { View, Text, useWindowDimensions, PlatformColor, Image, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

const HomeIndex = () => {
  const { width } = useWindowDimensions();

  const url = 'https://videos.pexels.com/video-files/854262/854262-sd_960_540_24fps.mp4';
  return (
    <ScrollView
      style={{
        flex: 1,

        backgroundColor: PlatformColor('secondarySystemBackground'),
      }}
      contentContainerStyle={{}}
      contentInsetAdjustmentBehavior="automatic">
      {/* <Stack.Screen options={{ title: 'Home' }} /> */}
      <View
        style={{
          alignItems: 'stretch',
          padding: 8,
          borderCurve: 'continuous',

          overflow: 'hidden',
        }}>
        <View
          style={{
            padding: 8,
            alignItems: 'stretch',
            gap: 4,
            flex: 1,
            width: '100%',
          }}>
          <Profile username="evanbacon" name={'Evan Bacon'} />

          <View style={{ gap: 8, flex: 1 }}>
            <Text
              style={{
                marginTop: 8,
                fontSize: 16,
                color: PlatformColor('label'),
              }}>
              Launch day is here! 🚀
            </Text>

            <Link
              href={'/(tabs)/home/video?url=' + url}
              style={{ flex: 1, height: 200, borderRadius: 16, overflow: 'hidden' }}>
              <Link.Trigger key="3">
                <View style={{ width: '100%', height: 200, flex: 1 }}>
                  <Image
                    source={{
                      uri: 'https://images.pexels.com/videos/854262/free-video-854262.jpg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200',
                    }}
                    style={{
                      height: 200,
                      flex: 1,
                      backgroundColor: 'orange',
                    }}
                  />
                </View>
              </Link.Trigger>

              <Link.Preview width={width} height={width * (9 / 16)}>
                <VideoPreview url={url} />
              </Link.Preview>
              {/* <Link.Menu>
                    <Link.MenuAction title="Not Interested" onPress={() => {}} />
                    <Link.MenuAction
                      title="View Interactions"
                      image="sf:polls"
                      onPress={() => {}}
                    />
                    <Link.MenuAction title="Report Post" image="sf:flag" onPress={() => {}} />
                  </Link.Menu> */}
            </Link>
          </View>

          <Text
            style={{
              marginTop: 8,
              color: PlatformColor('secondaryLabel'),
              fontSize: 12,
            }}>
            6:03AM • 6/24/25
          </Text>
        </View>
      </View>

      <View
        style={{
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: PlatformColor('separator'),
          alignItems: 'stretch',
          padding: 8,
          borderCurve: 'continuous',
          gap: 8,
          overflow: 'hidden',
        }}>
        <Post header={<Profile username="ubax" name={'Jakub Tkacz'} />}>
          <Text
            style={{
              marginTop: 8,
              fontSize: 16,
              color: PlatformColor('label'),
            }}>
            Best one yet!
          </Text>
        </Post>
        <Post header={<Profile username="kitten" name={'Phil Pluckthun'} />}>
          <Text
            style={{
              marginTop: 8,
              fontSize: 16,
              color: PlatformColor('label'),
            }}>
            Looking good :glamour_frog:
          </Text>
        </Post>
        <Post header={<Profile username="bycedric" name={'Cedric van Putten'} />}>
          <Text
            style={{
              marginTop: 8,
              fontSize: 16,
              color: PlatformColor('label'),
            }}>
            It happens
          </Text>
        </Post>
      </View>
    </ScrollView>
  );
};

function Profile({ username, name }: { username: string; name: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Image
        source={{ uri: `https://github.com/${username}.png` }}
        style={{
          borderRadius: 32,
          width: 48,
          height: 48,
        }}
      />
      <View>
        <Text
          style={{
            fontWeight: '600',
            fontSize: 16,
            color: PlatformColor('label'),
          }}>
          {name}
        </Text>
        <Text
          style={{
            // fontWeight: '600',
            fontSize: 16,
            color: PlatformColor('secondaryLabel'),
          }}>
          @{username}
        </Text>
      </View>
    </View>
  );
}

function Post({ header, children }) {
  return (
    <View
      style={{
        padding: 8,
        alignItems: 'stretch',
        gap: 4,
        flex: 1,
        width: '100%',
      }}>
      {header}
      <View style={{ gap: 8, flex: 1 }}>{children}</View>
    </View>
  );
}

function VideoPreview({ url }) {
  const player = useVideoPlayer(url, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <VideoView
      style={{
        flex: 1,
        minHeight: '100%',
        backgroundColor: PlatformColor('tertiarySystemBackground'),
      }}
      player={player}
      contentFit="cover"
      nativeControls={false}
      allowsFullscreen={false}
      allowsPictureInPicture={false}
    />
  );
}

export default HomeIndex;
