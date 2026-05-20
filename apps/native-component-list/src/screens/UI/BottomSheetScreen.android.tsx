import {
  Box,
  Button,
  Card,
  Column,
  Host,
  LazyColumn,
  ModalBottomSheet,
  RNHostView,
  Row,
  Switch,
  Text as ComposeText,
} from '@expo/ui/jetpack-compose';
import type { ModalBottomSheetRef } from '@expo/ui/jetpack-compose';
import {
  background,
  clip,
  fillMaxWidth,
  height,
  padding,
  Shapes,
  weight,
  width,
} from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';
import { Pressable, Text as RNText, View } from 'react-native';

export default function BottomSheetScreen() {
  const [showSheet, setShowSheet] = React.useState(false);
  const [showRNContent, setShowRNContent] = React.useState(false);
  const [showRNContentWithFlex, setShowRNContentWithFlex] = React.useState(false);
  const [counter, setCounter] = React.useState(0);

  const sheetRef = React.useRef<ModalBottomSheetRef>(null);
  const rnContentSheetRef = React.useRef<ModalBottomSheetRef>(null);
  const flexSheetRef = React.useRef<ModalBottomSheetRef>(null);

  // Configurable props
  const [skipPartiallyExpanded, setSkipPartiallyExpanded] = React.useState(false);
  const [showDragHandle, setShowDragHandle] = React.useState(true);
  const [useCustomDragHandle, setUseCustomDragHandle] = React.useState(false);
  const [sheetGesturesEnabled, setSheetGesturesEnabled] = React.useState(true);
  const [shouldDismissOnBackPress, setShouldDismissOnBackPress] = React.useState(true);
  const [shouldDismissOnClickOutside, setShouldDismissOnClickOutside] = React.useState(true);
  const [useCustomColors, setUseCustomColors] = React.useState(false);

  const hideSheet = async () => {
    await sheetRef.current?.hide();
    setShowSheet(false);
  };

  const hideRNContentSheet = async () => {
    await rnContentSheetRef.current?.hide();
    setShowRNContent(false);
  };

  const hideFlexSheet = async () => {
    await flexSheetRef.current?.hide();
    setShowRNContentWithFlex(false);
  };

  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 4 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText style={{ typography: 'titleMedium' }}>Configurable Sheet</ComposeText>
            <ComposeText style={{ typography: 'bodySmall' }} color="#666666">
              Toggle props below, then open the sheet.
            </ComposeText>

            <Column verticalArrangement={{ spacedBy: 0 }} modifiers={[padding(0, 8, 0, 0)]}>
              <Row
                modifiers={[fillMaxWidth()]}
                horizontalArrangement="spaceBetween"
                verticalAlignment="center">
                <ComposeText style={{ typography: 'bodyMedium' }}>
                  Skip partially expanded
                </ComposeText>
                <Switch value={skipPartiallyExpanded} onCheckedChange={setSkipPartiallyExpanded} />
              </Row>
              <Row
                modifiers={[fillMaxWidth()]}
                horizontalArrangement="spaceBetween"
                verticalAlignment="center">
                <ComposeText style={{ typography: 'bodyMedium' }}>Show drag handle</ComposeText>
                <Switch value={showDragHandle} onCheckedChange={setShowDragHandle} />
              </Row>
              <Row
                modifiers={[fillMaxWidth()]}
                horizontalArrangement="spaceBetween"
                verticalAlignment="center">
                <ComposeText style={{ typography: 'bodyMedium' }}>
                  Use custom drag handle
                </ComposeText>
                <Switch value={useCustomDragHandle} onCheckedChange={setUseCustomDragHandle} />
              </Row>
              <Row
                modifiers={[fillMaxWidth()]}
                horizontalArrangement="spaceBetween"
                verticalAlignment="center">
                <ComposeText style={{ typography: 'bodyMedium' }}>
                  Sheet gestures enabled
                </ComposeText>
                <Switch value={sheetGesturesEnabled} onCheckedChange={setSheetGesturesEnabled} />
              </Row>
              <Row
                modifiers={[fillMaxWidth()]}
                horizontalArrangement="spaceBetween"
                verticalAlignment="center">
                <ComposeText style={{ typography: 'bodyMedium' }}>
                  Dismiss on back press
                </ComposeText>
                <Switch
                  value={shouldDismissOnBackPress}
                  onCheckedChange={setShouldDismissOnBackPress}
                />
              </Row>
              <Row
                modifiers={[fillMaxWidth()]}
                horizontalArrangement="spaceBetween"
                verticalAlignment="center">
                <ComposeText style={{ typography: 'bodyMedium' }}>
                  Dismiss on click outside
                </ComposeText>
                <Switch
                  value={shouldDismissOnClickOutside}
                  onCheckedChange={setShouldDismissOnClickOutside}
                />
              </Row>
              <Row
                modifiers={[fillMaxWidth()]}
                horizontalArrangement="spaceBetween"
                verticalAlignment="center">
                <ComposeText style={{ typography: 'bodyMedium' }}>Use custom colors</ComposeText>
                <Switch value={useCustomColors} onCheckedChange={setUseCustomColors} />
              </Row>
            </Column>

            <Button onClick={() => setShowSheet(true)} modifiers={[fillMaxWidth()]}>
              <ComposeText>Open Sheet</ComposeText>
            </Button>
          </Column>
        </Card>

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 4 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText style={{ typography: 'titleMedium' }}>React Native Content</ComposeText>
            <ComposeText style={{ typography: 'bodySmall' }} color="#666666">
              Sheet with interactive RN views inside.
            </ComposeText>
            <Button onClick={() => setShowRNContent(true)} modifiers={[fillMaxWidth()]}>
              <ComposeText>Open RN Content Sheet</ComposeText>
            </Button>
          </Column>
        </Card>

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 4 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText style={{ typography: 'titleMedium' }}>
              React Native Content with flex: 1
            </ComposeText>
            <ComposeText style={{ typography: 'bodySmall' }} color="#666666">
              Sheet with RN views that fill available space.
            </ComposeText>
            <Button onClick={() => setShowRNContentWithFlex(true)} modifiers={[fillMaxWidth()]}>
              <ComposeText>Open Flex Content Sheet</ComposeText>
            </Button>
          </Column>
        </Card>
      </LazyColumn>

      {showSheet && (
        <ModalBottomSheet
          ref={sheetRef}
          onDismissRequest={() => setShowSheet(false)}
          skipPartiallyExpanded={skipPartiallyExpanded}
          showDragHandle={showDragHandle}
          sheetGesturesEnabled={sheetGesturesEnabled}
          properties={{
            shouldDismissOnBackPress,
            shouldDismissOnClickOutside,
          }}
          {...(useCustomColors && {
            containerColor: '#1a1a2e',
            contentColor: '#e0e0e0',
            scrimColor: '#806200EE',
          })}>
          {useCustomDragHandle && (
            <ModalBottomSheet.DragHandle>
              <Column
                horizontalAlignment="center"
                modifiers={[fillMaxWidth(), padding(0, 12, 0, 8)]}>
                <Box
                  modifiers={[width(60), height(6), clip(Shapes.Circle), background('#6200EE')]}
                />
              </Column>
            </ModalBottomSheet.DragHandle>
          )}
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <Row horizontalArrangement={{ spacedBy: 12 }} verticalAlignment="center">
              <ComposeText modifiers={[weight(1)]}>Bottom Sheet</ComposeText>
              <Button onClick={hideSheet}>
                <ComposeText>✕</ComposeText>
              </Button>
            </Row>
            <ComposeText>This sheet reflects the toggled props above.</ComposeText>
            <ComposeText>When skipPartiallyExpanded is off, drag up to expand.</ComposeText>
            <ComposeText>{'\n'}Additional content to allow full expansion:</ComposeText>
            <ComposeText>Item 1</ComposeText>
            <ComposeText>Item 2</ComposeText>
            <ComposeText>Item 3</ComposeText>
            <ComposeText>Item 4</ComposeText>
            <ComposeText>Item 5</ComposeText>
            <ComposeText>Item 6</ComposeText>
            <ComposeText>Item 7</ComposeText>
            <ComposeText>Item 8</ComposeText>
            <ComposeText>Item 9</ComposeText>
            <ComposeText>Item 10</ComposeText>
            <ComposeText>Item 11</ComposeText>
            <ComposeText>Item 12</ComposeText>
            <ComposeText>Item 13</ComposeText>
            <ComposeText>Item 14</ComposeText>
            <ComposeText>Item 15</ComposeText>
            <Button onClick={hideSheet}>
              <ComposeText>Close</ComposeText>
            </Button>
          </Column>
        </ModalBottomSheet>
      )}

      {showRNContent && (
        <ModalBottomSheet
          ref={rnContentSheetRef}
          onDismissRequest={() => setShowRNContent(false)}
          skipPartiallyExpanded={false}>
          <Column verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Mixing Compose + RN in a Bottom Sheet</ComposeText>
            <Row horizontalArrangement={{ spacedBy: 24 }} verticalAlignment="center">
              <RNHostView matchContents>
                <Pressable
                  onPress={() => setCounter((prev) => prev - 1)}
                  style={{
                    height: 50,
                    width: 50,
                    borderRadius: 100,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#9B59B6',
                  }}>
                  <RNText style={{ color: 'white', fontSize: 24 }}>-</RNText>
                </Pressable>
              </RNHostView>
              <ComposeText>{counter}</ComposeText>
              <RNHostView matchContents>
                <Pressable
                  onPress={() => setCounter((prev) => prev + 1)}
                  style={{
                    height: 50,
                    width: 50,
                    borderRadius: 100,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#9B59B6',
                  }}>
                  <RNText style={{ color: 'white', fontSize: 24 }}>+</RNText>
                </Pressable>
              </RNHostView>
            </Row>
            <RNHostView matchContents>
              <View style={{ padding: 24 }}>
                <RNText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
                  React Native Content
                </RNText>
                <RNText style={{ color: '#666', marginBottom: 16 }}>Counter: {counter}</RNText>
                <Pressable
                  style={{
                    backgroundColor: '#007AFF',
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                  onPress={() => setCounter((prev) => prev + 1)}>
                  <RNText style={{ color: 'white', fontWeight: '600' }}>Increment</RNText>
                </Pressable>
                <Pressable
                  style={{
                    backgroundColor: '#FF3B30',
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={hideRNContentSheet}>
                  <RNText style={{ color: 'white', fontWeight: '600' }}>Close</RNText>
                </Pressable>
              </View>
            </RNHostView>
          </Column>
        </ModalBottomSheet>
      )}

      {showRNContentWithFlex && (
        <ModalBottomSheet
          ref={flexSheetRef}
          onDismissRequest={() => setShowRNContentWithFlex(false)}
          skipPartiallyExpanded>
          <Column modifiers={[height(400), padding(16, 16, 16, 16)]}>
            <ComposeText>RN View with flex: 1</ComposeText>
            <RNHostView>
              <View style={{ flex: 1, backgroundColor: '#9B59B6', borderRadius: 10 }}>
                <RNText
                  style={{
                    color: 'white',
                    fontSize: 18,
                    fontWeight: 'bold',
                    padding: 16,
                  }}>
                  React Native Content (flex: 1)
                </RNText>
                <Pressable
                  style={{
                    backgroundColor: '#FF3B30',
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                    margin: 16,
                  }}
                  onPress={hideFlexSheet}>
                  <RNText style={{ color: 'white', fontWeight: '600' }}>Close</RNText>
                </Pressable>
              </View>
            </RNHostView>
          </Column>
        </ModalBottomSheet>
      )}
    </Host>
  );
}

BottomSheetScreen.navigationOptions = {
  title: 'BottomSheet',
};
