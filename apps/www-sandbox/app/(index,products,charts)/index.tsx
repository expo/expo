import { Button, ScrollView, Text, View } from 'react-native';

import WebDashboard from '@/components/www/dashboard';
import Charts from '@/components/www/charts';
import Auth01 from '@/components/www/authentication-01';
import Dashboard01 from '@/components/www/dashboard-01';
import { ChevronLeft } from 'lucide-react';

import { Stack } from 'expo-router';

import ThreeThing from '@/components/www/three-01';

import Content from '@/components/mdx/story.mdx';
import { getDOMComponents, MDXComponents } from '@bacons/mdx';

import MarshalProps from '@/components/www/marshal-props';
import { useState } from 'react';
export default function Route() {
  // return (
  //   <View>
  //     {/* <MDXComponents components={getDOMComponents()}>
  //       <Content />
  //     </MDXComponents> */}

  //     <MDXComponents
  //       components={{
  //         li: ({ children }) => <Text style={{ color: 'red' }}>- {children}</Text>,
  //       }}>
  //       <Content />
  //     </MDXComponents>
  //   </View>
  // );

  const [index, setIndex] = useState(0);
  return (
    <View style={{ flex: 1 }}>
      {/* <Stack.Screen
        options={{
          title: 'Dashboard',
        }}
      /> */}

      <MarshalProps
        index={index}
        onPress={() => {
          console.log('Pressed');
          setIndex((index) => index + 1);
        }}
      />

      <Button onPress={() => setIndex((index) => index + 1)} title="Increment" />

      {/* <ThreeThing /> */}
      {/* <Content /> */}

      {/* <Auth01 />
      <Dashboard01 />
      <Charts /> */}

      {/* <WebDashboard
        actions={{
          showNotifications(title) {
            // alert(title);
            // throw new Error('Error');
            return '....';
          },
          haptics() {
            alert('Haptics');
          },
        }}
      /> */}
      {/* {Array.from({ length: 100 }).map((_, i) => (
        <View key={i} style={{ padding: 20 }}>
          <Text>Item {i}</Text>
        </View>
      ))} */}
    </View>
  );
}
