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
} from '@expo/ui/swift-ui';
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
          <Text size={17} testID="test-id-from-expo-ui!">
            Some text!
          </Text>
          <Button onPress={() => alert('Clicked!')}>I'm a button</Button>
          <Switch value={switchValue} label="This is a switch" onValueChange={setSwitchValue} />
          <ColorPicker
            label="Select a color"
            selection={color}
            supportsOpacity
            onValueChanged={setColor}
          />
          <Picker
            label="Menu picker"
            options={options}
            selectedIndex={selectedIndex}
            onOptionSelected={({ nativeEvent: { index } }) => {
              setSelectedIndex(index);
            }}
            variant="menu"
          />
          <Slider value={sliderValue} onValueChange={setSliderValue} />
        </Section>

        <Section title="User Profiles">
          <Picker
            variant="menu"
            label="Profile Image Size"
            options={profileImageSizes}
            selectedIndex={selectedProfileImageSizeIndex}
            onOptionSelected={({ nativeEvent: { index } }) => {
              setSelectedProfileImageSizeIndex(index);
            }}
          />
          <Button
            onPress={() => {
              alert('Fake cache cleared');
            }}>
            Clear Image Cache
          </Button>
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
