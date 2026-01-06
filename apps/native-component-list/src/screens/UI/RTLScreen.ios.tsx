import {
  Button,
  Host,
  HStack,
  Image,
  Progress,
  Picker,
  Slider,
  Switch,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import { frame, pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';

import { ScrollPage, Section } from '../../components/Page';

export default function RTLTestScreen() {
  const [isRTL, setIsRTL] = React.useState(true);
  const [switchValue, setSwitchValue] = React.useState(true);
  const [pickerSelection, setPickerSelection] = React.useState<string | number>(0);
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
            <Button systemImage="house" label="בית" />
            <Button systemImage="arrow.forward.square" label="קדימה" />
            <Button systemImage="delete.forward" role="destructive" label="حذف" />
          </HStack>
        </Host>
      </Section>

      <Section title="Picker">
        <Host matchContents layoutDirection={isRTL ? 'rightToLeft' : 'leftToRight'}>
          <VStack spacing={12}>
            <Picker
              modifiers={[pickerStyle('segmented')]}
              selection={pickerSelection}
              onSelectionChange={setPickerSelection}>
              {options.map((option, index) => (
                <Text key={index} modifiers={[tag(index)]}>
                  {option}
                </Text>
              ))}
            </Picker>
            <Picker
              modifiers={[pickerStyle('menu')]}
              selection={pickerSelection}
              onSelectionChange={setPickerSelection}>
              {options.map((option, index) => (
                <Text key={index} modifiers={[tag(index)]}>
                  {option}
                </Text>
              ))}
            </Picker>
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
            <Progress progress={0.2} variant="linear" />
          </HStack>
        </Host>
      </Section>
    </ScrollPage>
  );
}

RTLTestScreen.navigationOptions = {
  title: 'RTL Layout',
};
