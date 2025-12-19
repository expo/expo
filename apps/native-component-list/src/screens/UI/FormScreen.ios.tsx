import {
  Button,
  ColorPicker,
  Host,
  Picker,
  Form,
  Section,
  Slider,
  Switch,
  Text,
  DisclosureGroup,
  ContentUnavailableView,
  LabeledContent,
} from '@expo/ui/swift-ui';
import { buttonStyle, font, pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';

export default function FormScreen() {
  const [color, setColor] = useState<string | null>('blue');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const options = ['$', '$$', '$$$', '$$$$'];
  const [sliderValue, setSliderValue] = useState<number>(0.5);
  const [switchValue, setSwitchValue] = useState<boolean>(true);

  const profileImageSizes = ['Large', 'Medium', 'Small'];
  const [disclosureGroupExpanded, setDisclosureGroupExpanded] = useState<boolean>(false);
  const [selectedProfileImageSizeIndex, setSelectedProfileImageSizeIndex] = useState<number>(0);

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section title="My form Section">
          <Text modifiers={[font({ size: 17 })]} testID="test-id-from-expo-ui!">
            Some text!
          </Text>
          <Button onPress={() => alert('Clicked!')} label="I'm a button" />
          <LabeledContent label="Labeled Content">
            <Button
              label="Labeled Content Button"
              modifiers={[buttonStyle('borderless')]}
              onPress={() => alert('Clicked!')}
            />
          </LabeledContent>
          <LabeledContent label="Name">
            <Text>Beto</Text>
          </LabeledContent>
          <LabeledContent
            label={
              <>
                <Text>Single Subtitle</Text>
                <Text>Subtitle</Text>
              </>
            }>
            <Text>Single Subtitle Value</Text>
          </LabeledContent>
          <LabeledContent
            label={
              <>
                <Text>Many Subtitles</Text>
                <Text>Subtitle 1</Text>
                <Text>Subtitle 2</Text>
                <Text>Subtitle 3</Text>
              </>
            }>
            <Text>Value</Text>
          </LabeledContent>
          <LabeledContent label="Labeled Slider ">
            <Slider value={sliderValue} onValueChange={setSliderValue} />
          </LabeledContent>
          <Switch value={switchValue} label="This is a switch" onValueChange={setSwitchValue} />
          <ColorPicker
            label="Select a color"
            selection={color}
            supportsOpacity
            onSelectionChange={setColor}
          />
          <Picker
            label="Menu picker"
            modifiers={[pickerStyle('menu')]}
            selection={selectedIndex}
            onSelectionChange={(selection) => {
              setSelectedIndex(selection);
            }}>
            {options.map((option, index) => (
              <Text key={index} modifiers={[tag(index)]}>
                {option}
              </Text>
            ))}
          </Picker>
          <Slider value={sliderValue} onValueChange={setSliderValue} />
        </Section>

        <Section title="User Profiles">
          <Picker
            label="Profile Image Size"
            modifiers={[pickerStyle('menu')]}
            selection={selectedProfileImageSizeIndex}
            onSelectionChange={(selection) => {
              setSelectedProfileImageSizeIndex(selection);
            }}>
            {profileImageSizes.map((size, index) => (
              <Text key={index} modifiers={[tag(index)]}>
                {size}
              </Text>
            ))}
          </Picker>
          <Button
            onPress={() => {
              alert('Fake cache cleared');
            }}
            label="Clear Image Cache"
          />
          <DisclosureGroup
            onStateChange={setDisclosureGroupExpanded}
            isExpanded={disclosureGroupExpanded}
            label="Show User Profile Details">
            <Text>Name: John Doe</Text>
            <Text>Email: john.doe@example.com</Text>
            <Text>Role: Administrator</Text>
          </DisclosureGroup>
          <ContentUnavailableView
            title="Card expired"
            systemImage="creditcard.trianglebadge.exclamationmark"
            description="Please update your payment information to continue using our services."
          />
        </Section>
      </Form>
    </Host>
  );
}

FormScreen.navigationOptions = {
  title: 'Form',
};
