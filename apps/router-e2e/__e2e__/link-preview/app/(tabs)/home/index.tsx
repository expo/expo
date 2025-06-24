import { Link, Stack } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  useWindowDimensions,
  PlatformColor,
  Image,
  TouchableOpacity,
} from 'react-native';
import { ScrollView } from 'react-native';

const HomeIndex = () => {
  return (
    <ScrollView
      style={{
        flex: 1,

        backgroundColor: PlatformColor('systemBackground'),
      }}
      contentContainerStyle={{
        padding: 12,
        gap: 24,
      }}
      automaticallyAdjustContentInsets
      contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: 'Home' }} />

      <Post
        name="Evan Bacon"
        username="evanbacon"
        image="https://images.pexels.com/videos/854262/free-video-854262.jpg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200"
        video="https://videos.pexels.com/video-files/854262/854262-sd_960_540_24fps.mp4"
        post="Launch day is here! 🚀"
      />

      <Post
        name="Expo"
        username="expo"
        image="https://images.pexels.com/videos/9385711/pexels-photo-9385711.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200"
        video="https://videos.pexels.com/video-files/9385711/9385711-sd_426_240_30fps.mp4"
        post="Today is all about space 🚀"
      />
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

function Post({
  image,
  video,
  username,
  name,
  post,
}: {
  image?: string;
  video?: string;
  username?: string;
  name: string;
  post: string;
}) {
  const { width } = useWindowDimensions();

  return (
    <View
      style={{
        backgroundColor: PlatformColor('secondarySystemBackground'),
        alignItems: 'stretch',

        borderCurve: 'continuous',
        borderRadius: 24,
        overflow: 'hidden',
      }}>
      <Link href="/(tabs)/home/one" asChild>
        <Link.Trigger>
          <TouchableOpacity activeOpacity={0.8}>
            <View
              style={{
                padding: 16,
                alignItems: 'stretch',
                gap: 4,
                flex: 1,
                width: '100%',
              }}>
              <Profile name={name} username={username} />

              <View style={{ gap: 8, flex: 1 }}>
                <Text
                  style={{
                    marginTop: 8,
                    fontSize: 16,
                    color: PlatformColor('label'),
                  }}>
                  {post}
                </Text>

                <Link
                  href={'/(tabs)/home/video?url=' + encodeURIComponent(video ?? '')}
                  style={{ flex: 1, height: 200, borderRadius: 16, overflow: 'hidden' }}>
                  <Link.Trigger>
                    <View style={{ width: '100%', height: 200, flex: 1 }}>
                      <Image
                        source={{
                          uri: image,
                        }}
                        style={{
                          height: 200,
                          flex: 1,
                          backgroundColor: PlatformColor('tertiarySystemBackground'),
                        }}
                      />
                    </View>
                  </Link.Trigger>

                  <Link.Preview width={width} height={width * (9 / 16)}>
                    <VideoPreview url={video} />
                  </Link.Preview>
                  <Link.Menu>
                    <Link.MenuAction title="Download Video" onPress={() => {}} />
                    <Link.MenuAction title="Remix Clip" onPress={() => {}} />
                    <Link.MenuAction title="Share via..." image="sf:flag" onPress={() => {}} />
                  </Link.Menu>
                </Link>
              </View>
            </View>
          </TouchableOpacity>
        </Link.Trigger>

        <Link.Preview />

        <Link.Menu>
          <Link.MenuAction title="Not Interested" onPress={() => {}} />
          <Link.MenuAction title="View Interactions" image="sf:polls" onPress={() => {}} />
          <Link.MenuAction title="Report Post" image="sf:flag" onPress={() => {}} />
          <Link.Menu title="Community Notes">
            <Link.MenuAction title="Write a Community Note" image="sf:people" onPress={() => {}} />
            <Link.MenuAction title="Request Community Note" image="sf:mega" onPress={() => {}} />
          </Link.Menu>
        </Link.Menu>
      </Link>
    </View>
  );
}

import { useVideoPlayer, VideoView } from 'expo-video';

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
