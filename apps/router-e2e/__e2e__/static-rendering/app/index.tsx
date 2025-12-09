import { Color, Link, Stack } from 'expo-router';
import { enableZoomTransition } from 'expo-router/internal/utils';
import { Toolbar } from 'expo-router/unstable-toolbar';
import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

enableZoomTransition();

export default function Page() {
  const [isShown, setIsShown] = useState(true);

  return (
    <>
      <Stack>
        <Stack.Header>
          <Stack.Header.SearchBar placement="integratedCentered" />
        </Stack.Header>
      </Stack>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1 }}
        onScroll={(e) => {
          // When scrolling over 60 pixels, hide the toolbar button
          if (e.nativeEvent.contentOffset.y > 60) {
            setIsShown(false);
          } else {
            setIsShown(true);
          }
        }}>
        <Link href="/about" asChild>
          <Link.Trigger>
            <Pressable
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
              }}>
              <Link.AppleZoom>
                <Image
                  source={{
                    uri: 'https://filmartgallery.com/cdn/shop/products/The-Matrix-Vintage-Movie-Poster-Original.jpg?v=1738903563',
                  }}
                  style={{
                    borderRadius: 24,
                    width: 300,
                    aspectRatio: 2 / 3,
                  }}
                />
              </Link.AppleZoom>
              <Text testID="index-text" style={{ fontSize: 20 }}>
                The Matrix
              </Text>
            </Pressable>
          </Link.Trigger>

          {/* Modify the link */}

          <Link.Menu>
            <Link.MenuAction title="Share" icon="square.and.arrow.up" onPress={() => {}} />
          </Link.Menu>

          {/*  */}

          <Link.Preview
            style={{
              width: 300,
              height: 300 * (3 / 2),
            }}>
            <Image
              source={{
                uri: 'https://filmartgallery.com/cdn/shop/products/The-Matrix-Vintage-Movie-Poster-Original.jpg?v=1738903563',
              }}
              style={{
                borderRadius: 24,
                width: 300,
                aspectRatio: 2 / 3,
              }}
            />
          </Link.Preview>
        </Link>
      </ScrollView>

      <Toolbar>
        <Toolbar.Menu icon="ellipsis">
          <Toolbar.Menu inline>
            <Toolbar.MenuAction
              title="View as Gallery"
              icon="rectangle.grid.2x2"
              onPress={() => {}}
            />
          </Toolbar.Menu>
          <Toolbar.MenuAction title="Select Notes" icon="checkmark.circle" onPress={() => {}} />
          <Toolbar.MenuAction title="View Attachments" icon="paperclip" onPress={() => {}} />
        </Toolbar.Menu>
        <Toolbar.Button>Edit</Toolbar.Button>

        <Toolbar.Spacer />

        <Toolbar.Button
          sharesBackground={false}
          sf="square.and.pencil"
          onPress={() => {}}
          barButtonItemStyle="prominent"
        />
      </Toolbar>
      {/* <Toolbar>
        <Toolbar.Menu icon="ellipsis">
          <Toolbar.MenuAction title="Hello" onPress={() => {}} />
        </Toolbar.Menu>
        <Toolbar.Spacer />
        <Toolbar.Button
          sf="plus"
          barButtonItemStyle="prominent"
          onPress={() => {
            
          }}
        />

        {isShown && (
          <Toolbar.Button
            sf="server.rack"
            tintColor={Color.ios.systemPink}
            hidden={false}
            onPress={() => {
              
            }}
          />
        )}
        <Toolbar.Button
          sf="car"
          onPress={() => {
            
          }}>
          Hey
        </Toolbar.Button>
      </Toolbar> */}
    </>
  );
}
