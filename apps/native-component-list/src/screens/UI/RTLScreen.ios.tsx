import {
  Button,
  Host,
  HStack,
  Image,
  LinearProgress,
  Picker,
  Slider,
  Switch,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import { frame } from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';

import { ScrollPage, Section } from '../../components/Page';

export default function RTLTestScreen() {
  const [isRTL, setIsRTL] = React.useState(true);
  const [switchValue, setSwitchValue] = React.useState(true);
  const [pickerIndex, setPickerIndex] = React.useState(0);
  const [sliderValue, setSliderValue] = React.useState(0.5);
  const options = ['אפשרות 1', 'אפשרות 2', 'خيار ١', 'خيار ٢'];

  return (
    <ScrollPage>
      <Section title="Switch">
        <Host
          matchContents={{ vertical: true }}
          layoutDirection={isRTL ? 'rightToLeft' : 'leftToRight'}>
          <VStack spacing={12} alignment="center">
            <Switch value={isRTL} onValueChange={setIsRTL} label="Enable RTL" />
            <Switch
              value={switchValue}
              onValueChange={setSwitchValue}
              modifiers={[frame({ width: 64 })]}
            />
          </VStack>
        </Host>
      </Section>

      <Section title="HStack">
        <Host
          matchContents={{ vertical: true }}
          layoutDirection={isRTL ? 'rightToLeft' : 'leftToRight'}>
          <VStack spacing={12}>
            <HStack spacing={12}>
              <Text>1. ראשון</Text>
              <Text>2. שני</Text>
              <Text>3. שלישי</Text>
            </HStack>
            <HStack spacing={8}>
              <Image systemName="bookmark" size={20} />
              <Text>إشارة مرجعية</Text>
            </HStack>
          </VStack>
        </Host>
      </Section>

      <Section title="Button with System Image">
        <Host
          matchContents={{ vertical: true }}
          layoutDirection={isRTL ? 'rightToLeft' : 'leftToRight'}>
          <HStack spacing={12}>
            <Button variant="default" systemImage="house">
              בית
            </Button>
            <Button variant="glass" systemImage="arrow.forward.square">
              קדימה
            </Button>
            <Button variant="borderedProminent" systemImage="delete.forward" role="destructive">
              حذف
            </Button>
          </HStack>
        </Host>
      </Section>

      <Section title="Picker">
        <Host matchContents layoutDirection={isRTL ? 'rightToLeft' : 'leftToRight'}>
          <VStack spacing={12}>
            <Picker
              variant="segmented"
              options={options}
              selectedIndex={pickerIndex}
              onOptionSelected={({ nativeEvent: { index } }) => setPickerIndex(index)}
            />
            <Picker
              variant="menu"
              options={options}
              selectedIndex={pickerIndex}
              onOptionSelected={({ nativeEvent: { index } }) => setPickerIndex(index)}
            />
          </VStack>
        </Host>
      </Section>

      <Section title="Slider">
        <Host matchContents layoutDirection={isRTL ? 'rightToLeft' : 'leftToRight'}>
          <HStack spacing={8}>
            <Text>مستوى الصوت:</Text>
            <Slider value={sliderValue} onValueChange={setSliderValue} />
            <Text>{`${Math.round(sliderValue * 100)}%`}</Text>
          </HStack>
        </Host>
      </Section>

      <Section title="LinearProgress">
        <Host matchContents layoutDirection={isRTL ? 'rightToLeft' : 'leftToRight'}>
          <HStack spacing={8}>
            <Text>20%</Text>
            <LinearProgress progress={0.2} />
          </HStack>
        </Host>
      </Section>
    </ScrollPage>
  );
}

RTLTestScreen.navigationOptions = {
  title: 'RTL Layout',
};
