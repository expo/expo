import {
  Card,
  Column,
  DropdownMenuItem,
  ExposedDropdownMenuBox,
  Host,
  LazyColumn,
  Text as ComposeText,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

export default function ExposedDropdownMenuBoxScreen() {
  const [selectedOption, setSelectedOption] = React.useState<string>('');
  const [expanded, setExpanded] = React.useState(false);
  const options = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];

  const [selectedFruit, setSelectedFruit] = React.useState<string>('Apple');
  const [fruitExpanded, setFruitExpanded] = React.useState(false);
  const fruits = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];

  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Basic</ComposeText>
            <ComposeText>Select an option from the dropdown menu.</ComposeText>
            <ExposedDropdownMenuBox
              value={selectedOption}
              expanded={expanded}
              onExpandedChange={setExpanded}>
              <ExposedDropdownMenuBox.Label>
                <ComposeText>Choose an option</ComposeText>
              </ExposedDropdownMenuBox.Label>
              <ExposedDropdownMenuBox.Items>
                {options.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => {
                      setSelectedOption(option);
                      setExpanded(false);
                    }}>
                    <DropdownMenuItem.Text>
                      <ComposeText>{option}</ComposeText>
                    </DropdownMenuItem.Text>
                  </DropdownMenuItem>
                ))}
              </ExposedDropdownMenuBox.Items>
            </ExposedDropdownMenuBox>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Pre-selected</ComposeText>
            <ComposeText>Dropdown with a default value already selected.</ComposeText>
            <ExposedDropdownMenuBox
              value={selectedFruit}
              expanded={fruitExpanded}
              onExpandedChange={setFruitExpanded}>
              <ExposedDropdownMenuBox.Label>
                <ComposeText>Fruit</ComposeText>
              </ExposedDropdownMenuBox.Label>
              <ExposedDropdownMenuBox.Items>
                {fruits.map((fruit) => (
                  <DropdownMenuItem
                    key={fruit}
                    onClick={() => {
                      setSelectedFruit(fruit);
                      setFruitExpanded(false);
                    }}>
                    <DropdownMenuItem.Text>
                      <ComposeText>{fruit}</ComposeText>
                    </DropdownMenuItem.Text>
                  </DropdownMenuItem>
                ))}
              </ExposedDropdownMenuBox.Items>
            </ExposedDropdownMenuBox>
          </Column>
        </Card>
      </LazyColumn>
    </Host>
  );
}

ExposedDropdownMenuBoxScreen.navigationOptions = {
  title: 'ExposedDropdownMenuBox',
};
