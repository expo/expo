import { Link } from 'expo-router';
import React from 'react';
import { Image, Pressable, ScrollView, Share, Text, View } from 'react-native';

import { Toolbar } from 'expo-router/unstable-toolbar';

export default function Page() {
  const [filter, setFilter] = React.useState('all');
  return (
    <ScrollView style={{ flex: 1 }}>
      <Link.AppleZoomTarget>
        <Image
          source={{
            uri: 'https://filmartgallery.com/cdn/shop/products/The-Matrix-Vintage-Movie-Poster-Original.jpg?v=1738903563',
          }}
          style={{ width: '100%', height: 400 }}
        />
      </Link.AppleZoomTarget>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 10 }}>Movie Title</Text>
        <View style={{ flexDirection: 'row', marginBottom: 15 }}>
          <Text style={{ marginRight: 15, color: '#666' }}>2024</Text>
          <Text style={{ marginRight: 15, color: '#666' }}>2h 30m</Text>
          <Text style={{ color: '#666' }}>Action</Text>
        </View>
        <Text style={{ fontSize: 16, lineHeight: 24, marginBottom: 20 }}>
          A gripping tale of adventure and suspense. This movie takes you on a journey through
          breathtaking landscapes and heart-pounding action sequences.
        </Text>
        <Pressable
          style={{
            backgroundColor: '#e50914',
            padding: 15,
            borderRadius: 5,
            alignItems: 'center',
            marginBottom: 10,
          }}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Play</Text>
        </Pressable>
        <Pressable
          style={{
            backgroundColor: '#333',
            padding: 15,
            borderRadius: 5,
            alignItems: 'center',
          }}>
          <Text style={{ color: 'white', fontSize: 16 }}>Add to List</Text>
        </Pressable>
      </View>

      <Toolbar>
        <Toolbar.Menu icon="line.3.horizontal.decrease">
          {[
            ['All Events', 'all'],
            ['Favorites', 'favorites'],
            ['Upcoming', 'upcoming'],
          ].map(([title, value]) => (
            <Toolbar.MenuAction
              key={value}
              isOn={filter === value}
              title={title}
              onPress={() => {
                setFilter(value);
              }}
            />
          ))}
        </Toolbar.Menu>

        <Toolbar.Spacer />
        <Toolbar.Button
          sf="square.and.arrow.up"
          sharesBackground={false}
          onPress={() => {
            Share.share({ message: 'Check out this awesome movie!' });
          }}
        />
        <Toolbar.Button
          sf="square.and.pencil"
          barButtonItemStyle="prominent"
          onPress={() => {
            /* Share action */
          }}
        />
      </Toolbar>
    </ScrollView>
  );
}
