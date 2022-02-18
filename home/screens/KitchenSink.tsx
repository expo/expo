import {
  Text,
  Heading,
  Button,
  View,
  Spacer,
  Divider,
  StatusIndicator,
  Row,
  ChevronRightIcon,
  Image,
  UserIcon,
  TerminalIcon,
} from 'expo-dev-client-components';
import * as React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function KitchenSink() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView>
        <View padding="medium">
          <View>
            <Button.ScaleOnPressContainer rounded="large" bg="default">
              <Row align="center" padding="medium">
                <StatusIndicator size="small" status="success" />
                <Spacer.Horizontal size="small" />
                <View flex="1">
                  <Button.Text color="default" numberOfLines={1}>
                    123
                  </Button.Text>
                </View>
                <Spacer.Horizontal size="small" />
                <ChevronRightIcon />
              </Row>
            </Button.ScaleOnPressContainer>
          </View>

          <Spacer.Vertical size="large" />

          <ButtonList items={['123', '456', '789']} />

          <Spacer.Vertical size="large" />

          <Header title="Form Duo" subtitle="form-duo" />

          <Spacer.Vertical size="large" />

          <Row px="small" align="center">
            <View px="medium">
              <TerminalIcon />
            </View>
            <Heading color="secondary">Development servers</Heading>
          </Row>
          <Spacer.Vertical size="medium" />
          <View padding="medium" bg="default" roundedTop="large">
            <Text>Start a local development server with:</Text>
            <Spacer.Vertical size="small" />

            <View bg="secondary" border="default" rounded="medium" padding="medium">
              <Text type="mono">expo start --dev-client</Text>
            </View>

            <Spacer.Vertical size="small" />
            <Text>Then, select the local server when it appears here.</Text>
            <Spacer.Vertical size="small" />
            <Text>
              Alternatively, open the Camera app and scan the QR code that appears in your terminal
            </Text>
          </View>
          <Divider />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ButtonList({ items = [] }: { items: string[] }) {
  return (
    <View>
      {items.map((item, index, arr) => {
        const isFirst = index === 0;
        const isLast = index === arr.length - 1;

        return (
          <View key={item}>
            <Button.ScaleOnPressContainer
              bg="default"
              roundedTop={isFirst ? 'large' : 'none'}
              roundedBottom={isLast ? 'large' : 'none'}>
              <Row align="center" padding="medium">
                <StatusIndicator size="small" status="success" />
                <Spacer.Horizontal size="small" />
                <View flex="1">
                  <Button.Text color="default" numberOfLines={1}>
                    {item}
                  </Button.Text>
                </View>
                <Spacer.Horizontal size="small" />
                <ChevronRightIcon />
              </Row>
            </Button.ScaleOnPressContainer>
            {!isLast && <Divider />}
          </View>
        );
      })}
    </View>
  );
}

function Header({ title = '', subtitle = '', uri = '' }) {
  return (
    <View bg="default" rounded="large" py="medium">
      <Row align="center">
        <Row px="medium">
          <View bg="secondary">
            <Image size="xl" rounded="medium" source={{ uri }} />
          </View>

          <Spacer.Horizontal size="small" />

          <View>
            <Heading weight="semibold">{title}</Heading>
            <Text size="small" color="secondary">
              {subtitle}
            </Text>
          </View>
        </Row>

        <Spacer.Horizontal />

        <Button.ScaleOnPressContainer
          minScale={0.85}
          accessibilityLabel="Navigate to User Profile"
          bg="default"
          rounded="full">
          <View rounded="full" padding="medium">
            <UserIcon />
          </View>
        </Button.ScaleOnPressContainer>
      </Row>
    </View>
  );
}
