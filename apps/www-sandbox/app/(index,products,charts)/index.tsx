import { ScrollView, Text, View } from 'react-native';

import WebDashboard from '@/components/www/dashboard';
import Charts from '@/components/www/charts';
import Auth01 from '@/components/www/authentication-01';
import Dashboard01 from '@/components/www/dashboard-01';
import { ChevronLeft } from 'lucide-react';

import { Stack } from 'expo-router';

import Content from '@/components/mdx/story.mdx';
import { getDOMComponents, MDXComponents } from '@bacons/mdx';

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
  return (
    <ScrollView style={{ flex: 1 }}>
      {/* <Stack.Screen
        options={{
          title: 'Dashboard',
        }}
      /> */}

      <Content />
      {/* <ChevronLeft /> */}

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
      {Array.from({ length: 100 }).map((_, i) => (
        <View key={i} style={{ padding: 20 }}>
          <Text>Item {i}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
