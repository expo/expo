// import { Button, Picker, Switch, ContextMenu, Submenu } from '@expo/ui/jetpack-compose';
// import { useVideoPlayer, VideoView } from 'expo-video';
import * as React from 'react';
import { View, /* StyleSheet, */ Text } from 'react-native';

// import { Section } from '../../components/Page';

// const videoLink =
//   'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_2MB.mp4';

export default function ContextMenuScreen() {
  // const [selectedIndex, setSelectedIndex] = React.useState<number | null>(1);
  // const [switchChecked, setSwitchChecked] = React.useState<boolean>(true);
  // const [switch2Checked, setSwitch2Checked] = React.useState<boolean>(true);

  // const player = useVideoPlayer(videoLink, (player) => {
  //   player.loop = true;
  //   player.muted = true;
  //   player.play();
  // });

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ textAlign: 'center' }}>Example temporarily disabled on Android.</Text>
      {/* TODO: Bring back Android examples */}
      {/* <Section title="Colorful Context Menu">
        <ContextMenu color="#e3b7ff">
          <ContextMenu.Trigger>
            <Button variant="bordered" style={{ width: 200, height: 50 }}>
              Show Colorful Menu
            </Button>
          </ContextMenu.Trigger>
          <ContextMenu.Items>
            <Button variant="bordered" color="#ff0000">
              I'm red!
            </Button>
            <Button
              variant="bordered"
              elementColors={{ containerColor: '#0000ff', contentColor: '#00ff00' }}>
              My text is green!
            </Button>
            <Switch
              value={switchChecked}
              label="I'm very colorful!"
              variant="checkbox"
              elementColors={{
                checkedColor: '#ff0000',
                disabledCheckedColor: '#00ff00',
                uncheckedColor: '#0000ff',
                checkmarkColor: '#ffff00',
              }}
              onValueChange={setSwitchChecked}
            />
            <Switch
              value={switch2Checked}
              variant="switch"
              label="Switches can be colorul too!"
              onValueChange={setSwitch2Checked}
              elementColors={{
                checkedThumbColor: '#ff0000',
                checkedTrackColor: '#00ff00',
                uncheckedThumbColor: '#0000ff',
                uncheckedTrackColor: '#ffff00',
              }}
            />
          </ContextMenu.Items>
        </ContextMenu>
      </Section> */}
    </View>
  );
}

ContextMenuScreen.navigationOptions = {
  title: 'Context Menu',
};

// const styles = StyleSheet.create({
//   menuIcon: {
//     width: 32,
//     height: 32,
//   },
//   longPressMenu: {
//     width: 200,
//     height: 200,
//   },
//   preview: {
//     width: 300,
//     height: 200,
//     padding: 20,
//     backgroundColor: '#ffeeee',
//   },
// });
