import { Button, Divider, Heading, Row, Spacer, View, XIcon } from 'expo-dev-client-components';
import * as React from 'react';
import { useTVEventHandler, TVEventControl } from 'react-native';

import { useModalStack } from '../providers/ModalStackProvider';

type BaseModalProps = {
  title?: string;
  children: React.ReactNode;
};

export function BaseModal({ children, title }: BaseModalProps) {
  const modalStack = useModalStack();

  const onClosePress = () => {
    modalStack.pop();
  };

  useTVEventHandler((event) => {
    if (event.eventType === 'menu') {
      modalStack.pop();
    }
  });

  React.useEffect(() => {
    TVEventControl.enableTVMenuKey();
    return () => {
      TVEventControl.disableTVMenuKey();
    };
  }, []);

  return (
    <View bg="default" rounded="large" shadow="medium" mx="small">
      <View padding="medium">
        <Row align="center" bg="default">
          <View>
            <Heading>{title}</Heading>
          </View>
          <Spacer.Horizontal />

          <View style={{ transform: [{ translateX: 6 }, { translateY: -3 }] }}>
            <Button.FadeOnPressContainer bg="default" rounded="full" onPress={onClosePress}>
              <View padding="tiny" rounded="full" bg="default">
                <XIcon />
              </View>
            </Button.FadeOnPressContainer>
          </View>
        </Row>
      </View>

      <Divider />

      <View padding="medium">{children}</View>
    </View>
  );
}
