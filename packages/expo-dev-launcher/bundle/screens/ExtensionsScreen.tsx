import {
  Heading,
  Spacer,
  View,
  Text,
  Button,
  useExpoPalette,
  Row,
  ChevronRightIcon,
  Divider,
  BranchIcon,
  UpdateIcon,
  ExtensionsIcon,
} from 'expo-dev-client-components';
import * as React from 'react';
import { SafeAreaView } from 'react-native';

export function ExtensionsScreen() {
  const extensions = [];
  const palette = useExpoPalette();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View flex="1">
        {extensions.length === 0 && (
          <View bg="default" mx="medium" py="medium" px="medium" rounded="medium">
            <View align="centered">
              <ExtensionsIcon />
            </View>
            <Spacer.Vertical size="medium" />
            <View px="small">
              <Text size="small" align="center">
                Extensions allow you to customize your development app with additional capabilities.
              </Text>
            </View>

            <Spacer.Vertical size="small" />

            <View align="centered">
              <Button.ScaleOnPressContainer bg="ghost" rounded="small">
                <View border="default" px="small" py="2" rounded="small">
                  <Button.Text color="ghost" weight="semibold" size="small">
                    Learn More
                  </Button.Text>
                </View>
              </Button.ScaleOnPressContainer>
            </View>
          </View>
        )}

        <View mx="medium">
          <View py="small" px="small">
            <Heading size="small" color="secondary">
              EAS Update
            </Heading>
          </View>

          <Button.ScaleOnPressContainer bg="default" rounded="none" roundedTop="medium">
            <View bg="default" roundedTop="large" py="small" px="small">
              <Row>
                <Row
                  style={{ backgroundColor: palette.blue['100'] }}
                  py="tiny"
                  px="1.5"
                  rounded="medium"
                  align="center">
                  <BranchIcon
                    style={{ maxHeight: 10, maxWidth: 12, resizeMode: 'contain' }}
                    resizeMethod="scale"
                  />
                  <Spacer.Horizontal size="tiny" />
                  <Text size="small">Branch: main</Text>
                </Row>
                <Spacer.Horizontal />

                <ChevronRightIcon />
              </Row>

              <Spacer.Vertical size="small" />

              <View>
                <Row>
                  <View>
                    <Spacer.Vertical size="tiny" />
                    <UpdateIcon />
                  </View>
                  <Spacer.Horizontal size="small" />
                  <View flex="1" shrink="1">
                    <Heading size="small" numberOfLines={1}>
                      Update "Fixes typo"
                    </Heading>
                    <Spacer.Vertical size="tiny" />
                    <Text size="small" color="secondary">
                      Published May 16, 2021, 3:15PM
                    </Text>
                  </View>
                </Row>
              </View>
            </View>
          </Button.ScaleOnPressContainer>

          <Divider />

          <Button.ScaleOnPressContainer bg="default" rounded="none">
            <View bg="default" py="small" px="small">
              <Row>
                <Row
                  style={{ backgroundColor: palette.blue['100'] }}
                  rounded="medium"
                  py="tiny"
                  px="1.5"
                  align="center">
                  <BranchIcon
                    style={{ maxHeight: 10, maxWidth: 12, resizeMode: 'contain' }}
                    resizeMethod="scale"
                  />
                  <Spacer.Horizontal size="tiny" />
                  <Text size="small">Branch: staging</Text>
                </Row>
                <Spacer.Horizontal />
                <ChevronRightIcon />
              </Row>

              <Spacer.Vertical size="small" />

              <View>
                <Row>
                  <View>
                    <Spacer.Vertical size="tiny" />
                    <UpdateIcon />
                  </View>
                  <Spacer.Horizontal size="small" />
                  <View flex="1" shrink="1">
                    <Heading size="small" numberOfLines={1}>
                      Update "Adds header on screen 123132"
                    </Heading>
                    <Spacer.Vertical size="tiny" />
                    <Text size="small" color="secondary">
                      Published May 16, 2021, 3:15PM
                    </Text>
                  </View>
                </Row>
              </View>
            </View>
          </Button.ScaleOnPressContainer>

          <Divider />

          <Button.ScaleOnPressContainer bg="default" rounded="none" roundedBottom="medium">
            <View bg="default" py="small" px="small" roundedBottom="medium">
              <Row>
                <Text>See all branches</Text>
                <Spacer.Horizontal />
                <ChevronRightIcon />
              </Row>
            </View>
          </Button.ScaleOnPressContainer>
        </View>

        <Spacer.Vertical size="medium" />

        <View px="xl">
          <Text size="small" color="secondary">
            Extensions allow you to customize your development app with additional capabilities.{' '}
            <Text size="small" color="secondary">
              Learn more.
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
