import { describeAutoHostBehavior, type AutoHostTestCase } from './autoHost-test.shared';
import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Collapsible } from '../Collapsible';
import { Column } from '../Column';
import { FieldGroup } from '../FieldGroup';
import { Host } from '../Host';
import { Icon } from '../Icon';
import { List } from '../List';
import { ListItem } from '../ListItem';
import { Picker } from '../Picker';
import { RNHostView } from '../RNHostView';
import { Row } from '../Row';
import { ScrollView } from '../ScrollView';
import { Slider } from '../Slider';
import { Spacer } from '../Spacer';
import { Switch } from '../Switch';
import { Text } from '../Text';
import { TextInput } from '../TextInput';

jest.mock('expo', () => require('./expoUIMock').createExpoUIMock());

const nativeComponentCases: AutoHostTestCase[] = [
  { name: 'Button', render: () => <Button label="Press me" /> },
  { name: 'Text', render: () => <Text>Text</Text> },
  { name: 'Icon', render: () => <Icon name={{ android: 1, ios: 'star' }} /> },
  { name: 'Switch', render: () => <Switch value={false} onValueChange={jest.fn()} /> },
  { name: 'Checkbox', render: () => <Checkbox value={false} onValueChange={jest.fn()} /> },
  { name: 'Slider', render: () => <Slider value={0.5} onValueChange={jest.fn()} /> },
  { name: 'TextInput', render: () => <TextInput value="Text" onChangeText={jest.fn()} /> },
  {
    name: 'Picker',
    render: () => (
      <Picker selectedValue="one" onValueChange={jest.fn()}>
        <Picker.Item label="One" value="one" />
      </Picker>
    ),
  },
  { name: 'Column', render: () => <Column /> },
  { name: 'Row', render: () => <Row /> },
  { name: 'ScrollView', render: () => <ScrollView /> },
  { name: 'List', render: () => <List /> },
  { name: 'ListItem', render: () => <ListItem>Item</ListItem> },
  {
    name: 'FieldGroup',
    render: () => (
      <FieldGroup>
        <FieldGroup.Section title="Section" />
      </FieldGroup>
    ),
  },
  { name: 'FieldGroup.Section', render: () => <FieldGroup.Section title="Section" /> },
  {
    name: 'Collapsible',
    render: () => <Collapsible isOpen={false} onOpenChange={jest.fn()} label="Section" />,
  },
  { name: 'Spacer', render: () => <Spacer size={8} /> },
];

const hostOwningComponentCases: AutoHostTestCase[] = [
  {
    name: 'BottomSheet',
    render: () => (
      <BottomSheet isPresented onDismiss={jest.fn()}>
        <Button label="Press me" />
      </BottomSheet>
    ),
  },
];

describeAutoHostBehavior({
  Button,
  Host,
  RNHostView,
  nativeComponentCases,
  hostOwningComponentCases,
});
