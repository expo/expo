import { Link, usePathname } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  useWindowDimensions,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';

import { useTimer } from '../utils/useTimer';

const HomeIndex = () => {
  const pathname = usePathname();
  const time = useTimer();
  const { width, height } = useWindowDimensions();

  return (
    <ScrollView
      style={{ backgroundColor: '#84DCC6' }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
      contentInsetAdjustmentBehavior="automatic">
      <View>
        <Text>Misc</Text>
        <Text>Current Path: {pathname}</Text>
      </View>
      <Text>Time: {time}</Text>
      <Spacer />
      <Link href="/">
        <Link.Trigger>Link.Preview: /</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/misc">
        <Link.Trigger>Link.Preview: /misc</Link.Trigger>
        <Link.Preview />
      </Link>
      <Spacer />
      <Link href="/one">Normal link: /one</Link>
      <Link href="/one">
        <Link.Trigger>Normal link with trigger: /one</Link.Trigger>
      </Link>
      <Link href="/one" asChild>
        <Link.Trigger>
          <TouchableOpacity>
            <Text>Normal link with trigger asChild: /one with zoom</Text>
          </TouchableOpacity>
        </Link.Trigger>
      </Link>
      <Link href="/one">
        <Link.Trigger>
          <Text>Normal link with trigger: /one</Text>
          <View style={{ width: 20, height: 20, backgroundColor: 'orange' }} />
          <Text>Multiple children</Text>
        </Link.Trigger>
      </Link>
      <Link href="/one" asChild>
        <Link.Trigger>
          <TouchableOpacity style={{ backgroundColor: '#fff' }}>
            <Text>Normal link with trigger: /one</Text>
            <View style={{ width: 20, height: 20, backgroundColor: 'orange' }} />
            <Text>Multiple children</Text>
          </TouchableOpacity>
        </Link.Trigger>
      </Link>
      <Link href="/one">
        <Link.Trigger>Link.Preview: /one with zoom</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/one">
        <Link.Trigger>
          <Text>Link with preview: /one</Text>
          <View style={{ width: 20, height: 20, backgroundColor: 'orange' }} />
          <Text>Multiple children</Text>
        </Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/one" asChild>
        <Link.Trigger>
          <Pressable style={{ backgroundColor: '#fff' }}>
            <Text>Link with preview and asChild: /one</Text>
            <View style={{ width: 20, height: 20, backgroundColor: 'orange' }} />
            <Text>Multiple children</Text>
          </Pressable>
        </Link.Trigger>
        <Link.Preview />
      </Link>
      <Spacer />
      <Link href="/one">
        <Link.Trigger>Link.Preview 200x100: /one</Link.Trigger>
        <Link.Preview style={{ width: 200, height: 100 }} />
      </Link>
      <Link href="/one">
        <Link.Trigger>Link.Preview 16:9: /one</Link.Trigger>
        <Link.Preview style={{ width, height: width * (9 / 16) }} />
      </Link>
      <Link href="/one">
        <Link.Trigger>Link.Preview 1234x4321: /one</Link.Trigger>
        <Link.Preview style={{ width: 1234, height: 4321 }} />
      </Link>
      <Link href="/one">
        <Link.Trigger>Link.Preview styled: /one</Link.Trigger>
        <Link.Preview
          style={{
            width: 300,
            height: 400,
            borderRadius: 2,
          }}
        />
      </Link>
      <Spacer />
      <Link href={`/one?time=${time}`}>
        <Link.Trigger>/one?time={time}</Link.Trigger>
        <Link.Preview />
      </Link>
      <Spacer />
      <Link href="/protected">
        <Link.Trigger>/protected</Link.Trigger>
        <Link.Preview />
      </Link>
      <Spacer />
      <Link href="https://expo.dev" asChild>
        <Link.Trigger>
          <Text>https://expo.dev as Child</Text>
        </Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="https://expo.dev">
        <Link.Trigger>https://expo.dev</Link.Trigger>
        <Link.Preview />
      </Link>
      <Spacer />
      <Link href="/404">
        <Link.Trigger>Link.Preview: Unmatched Route</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/_sitemap">
        <Link.Trigger>Link.Preview: Sitemap</Link.Trigger>
        <Link.Preview />
      </Link>
      <Spacer />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          gap: 8,
          width: '100%',
        }}>
        <Link href="/zoom-dest" asChild>
          <Link.Trigger withAppleZoom>
            <Pressable style={{ flex: 5, aspectRatio: width / height }}>
              <Image
                source={require('../../../assets/frog.jpg')}
                resizeMode="cover"
                style={{ width: '100%', height: '100%' }}
              />
            </Pressable>
          </Link.Trigger>
        </Link>
        <Link href="/zoom-dest" asChild>
          <Link.Trigger>
            <Pressable style={{ flex: 3, alignItems: 'center' }}>
              <Link.AppleZoom>
                <View style={{ width: '100%', aspectRatio: width / height }}>
                  <Image
                    source={require('../../../assets/frog.jpg')}
                    resizeMode="cover"
                    style={{ width: '100%', height: '100%' }}
                  />
                </View>
              </Link.AppleZoom>
              <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
                The frog
              </Text>
              <Text style={{ textAlign: 'center' }}>Photo by David Clode on Unsplash</Text>
            </Pressable>
          </Link.Trigger>
        </Link>
        <Link href="/zoom-dest-contain" asChild>
          <Link.Trigger>
            <Link.AppleZoom>
              <Pressable style={{ flex: 5, alignItems: 'center' }}>
                <View style={{ width: '100%', aspectRatio: 1 }}>
                  <Image
                    source={require('../../../assets/frog.jpg')}
                    resizeMode="cover"
                    style={{ width: '100%', height: '100%' }}
                  />
                </View>
              </Pressable>
            </Link.AppleZoom>
          </Link.Trigger>
        </Link>
      </View>
      <Spacer />
      <Text>Zoom with preview:</Text>
      <Link href="/zoom-dest" asChild>
        <Link.Trigger withAppleZoom>
          <Pressable style={{ flex: 1, width: '33%', aspectRatio: width / height }}>
            <Image
              source={require('../../../assets/frog.jpg')}
              resizeMode="cover"
              style={{ width: '100%', height: '100%' }}
            />
          </Pressable>
        </Link.Trigger>
        <Link.Preview />
      </Link>
    </ScrollView>
  );
};

const Spacer = () => (
  <View
    style={{
      width: '100%',
      height: 16,
    }}
  />
);

export default HomeIndex;
