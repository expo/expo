import {
  ColorPicker,
  DatePicker,
  DatePickerComponent,
  Form,
  Host,
  LabeledContent,
  Picker,
  Section,
  Switch,
  Text,
} from '@expo/ui/swift-ui';
import {
  animation,
  datePickerStyle,
  pickerStyle,
  tag,
  tint,
  Animation,
} from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';

const displayedComponentsOptions = [
  {
    value: ['date'],
    label: 'Date',
  },
  {
    value: ['hourAndMinute'],
    label: 'Time',
  },
  {
    value: ['date', 'hourAndMinute'],
    label: 'Both',
  },
];
const styleOptions = ['automatic', 'compact', 'graphical', 'wheel'] as const;
export default function DatePickerScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [styleIndex, setStyleIndex] = useState(0);
  const [displayedComponentsIndex, setDisplayedComponentsIndex] = useState(0);
  const [useRange, setUseRange] = useState(false);
  const [tintColor, setTintColor] = useState<string | null>('#007AFF');
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const [animate, setAnimate] = useState(false);

  return (
    <Host style={{ flex: 1 }}>
      <Form modifiers={[animation(Animation.default, animate)]}>
        <Section title="Date Picker">
          <DatePicker
            title="Select date"
            selection={selectedDate}
            displayedComponents={
              displayedComponentsOptions[displayedComponentsIndex]
                .value as unknown as DatePickerComponent[]
            }
            range={useRange ? { start: today, end: thirtyDaysFromNow } : undefined}
            onDateChange={(date) => setSelectedDate(date)}
            modifiers={[
              datePickerStyle(styleOptions[styleIndex]),
              ...(tintColor ? [tint(tintColor)] : []),
            ]}
          />
        </Section>
        <Section title="Selected Values">
          <LabeledContent label="Date">
            <Text>{selectedDate.toDateString()}</Text>
          </LabeledContent>
          <LabeledContent label="Time">
            <Text>{selectedDate.toLocaleTimeString()}</Text>
          </LabeledContent>
        </Section>
        <Section title="Configuration">
          <Picker
            label="Style"
            modifiers={[pickerStyle('menu')]}
            selection={styleIndex}
            onSelectionChange={(selection) => {
              setStyleIndex(selection);
              setAnimate(!animate);
            }}>
            {styleOptions.map((option, index) => (
              <Text key={index} modifiers={[tag(index)]}>
                {option}
              </Text>
            ))}
          </Picker>
          <Picker
            label="Components"
            modifiers={[pickerStyle('menu')]}
            selection={displayedComponentsIndex}
            onSelectionChange={(selection) => {
              setDisplayedComponentsIndex(selection);
              setAnimate(!animate);
            }}>
            {displayedComponentsOptions.map((option, index) => (
              <Text key={index} modifiers={[tag(index)]}>
                {option.label}
              </Text>
            ))}
          </Picker>
          <Switch value={useRange} label="Limit to next 30 days" onValueChange={setUseRange} />
          <ColorPicker label="Tint Color" selection={tintColor} onValueChanged={setTintColor} />
        </Section>
        <Section title="Date Picker with custom label">
          <DatePicker
            selection={selectedDate}
            displayedComponents={
              displayedComponentsOptions[displayedComponentsIndex]
                .value as unknown as DatePickerComponent[]
            }
            range={useRange ? { start: today, end: thirtyDaysFromNow } : undefined}
            onDateChange={(date) => setSelectedDate(date)}
            modifiers={[datePickerStyle(styleOptions[styleIndex])]}>
            <Text color="#007AFF">Select date</Text>
            <Text>{selectedDate.toDateString()}</Text>
          </DatePicker>
        </Section>
      </Form>
    </Host>
  );
}

DatePickerScreen.navigationOptions = {
  title: 'DatePicker',
};
