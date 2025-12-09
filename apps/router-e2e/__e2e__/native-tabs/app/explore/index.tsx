import { ScrollView } from 'react-native';

import { Post } from '../../components/Post';
import { Toolbar } from 'expo-router/unstable-toolbar';

export default function Index() {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        padding: 32,
        gap: 16,
        width: '100%',
      }}>
      <Post title="New watches in August" href="/explore/news/new-watches-august" />
      <Post title="We are featured in a movie" href="/explore/news/we-are-featured-in-a-movie" />
      <Post title="Holiday deal 1 + 1" href="/explore/news/holiday-deal-1-1" />
      <Post title="Get family discount" href="/explore/news/get-family-discount" />

      {/* <Toolbar>
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
        <Toolbar.Spacer />
        <Toolbar.Button
          sharesBackground={false}
          sf="square.and.pencil"
          onPress={() => {}}
          barButtonItemStyle="prominent"
        />
      </Toolbar> */}
    </ScrollView>
  );
}
