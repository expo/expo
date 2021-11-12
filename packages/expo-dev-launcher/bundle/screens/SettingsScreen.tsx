import { CheckIcon } from '@expo/styleguide-native';
import * as React from 'react';
import { ScrollView, Switch } from 'react-native';

import { Button } from '../components/redesign/Button';
import { ShakeDeviceIcon } from '../components/redesign/ShakeDeviceIcon';
import { ShowMenuIcon } from '../components/redesign/ShowMenuIcon';
import { Heading, Text } from '../components/redesign/Text';
import { ThreeFingerPressIcon } from '../components/redesign/ThreeFingerPressIcon';
import { ToolbarOverlayIcon } from '../components/redesign/ToolbarOverlayIcon';
import { Divider, Row, Spacer, View } from '../components/redesign/View';

export function SettingsScreen(props: any) {
  return (
    <ScrollView>
      <Spacer.Vertical size="large" />

      <View py="large" px="medium">
        <View bg="default" rounded="large">
          <Row px="medium" py="small" align="center">
            <ShowMenuIcon />
            <Spacer.Horizontal size="small" />
            <Text size="large">Show menu at launch</Text>
            <Spacer.Horizontal size="flex" />
            <Switch />
          </Row>

          <Divider />

          <Row px="medium" py="small">
            <ToolbarOverlayIcon />
            <Spacer.Horizontal size="small" />
            <View shrink="1">
              <Text size="large">Toolbar overlay</Text>
              <Text size="small" color="secondary" leading="large">
                You may also summon this menu with a three-finger long-press.
              </Text>
            </View>
            <Spacer.Horizontal size="flex" />
            <Switch />
          </Row>
        </View>

        <Spacer.Vertical size="large" />

        <View padding="medium">
          <Heading size="small" color="secondary">
            Menu gestures
          </Heading>
        </View>

        <View bg="default" rounded="large">
          <Button>
            <Row px="medium" py="small" align="center">
              <ShakeDeviceIcon />
              <Spacer.Horizontal size="small" />
              <Text size="large" color="secondary">
                Shake Device
              </Text>
              <Spacer.Horizontal size="flex" />
              <CheckIcon />
            </Row>
          </Button>

          <Divider />

          <Button>
            <Row px="medium" py="small">
              <ThreeFingerPressIcon />
              <Spacer.Horizontal size="small" />
              <Text size="large" color="secondary">
                Three-finger long-press
              </Text>
              <Spacer.Horizontal size="flex" />
              <CheckIcon />
            </Row>
          </Button>
        </View>

        <View padding="small">
          <Text color="secondary" size="small" leading="large">
            Selected gestures will toggle the developer menu while inside a preview. The menu allows
            you to reload or return to home, and exposes developer tools.
          </Text>
        </View>

        <Spacer.Vertical size="medium" />

        <View bg="default" rounded="large">
          <Row px="medium" py="small" align="center">
            <Text size="large">Version</Text>
            <Spacer.Horizontal size="flex" />
            <Text>2.18.6.1011344</Text>
          </Row>

          <Divider />

          <Row px="medium" py="small" align="center">
            <Text size="large">Runtime Version</Text>
            <Spacer.Horizontal size="flex" />
            <Text>14</Text>
          </Row>

          <Divider />

          <Row px="medium" py="small" align="center">
            <Text color="primary" size="large">
              Tap to Copy All
            </Text>
          </Row>
        </View>
      </View>
    </ScrollView>
  );
}
