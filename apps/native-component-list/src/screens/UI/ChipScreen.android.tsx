import {
  Host,
  AssistChip,
  InputChip,
  SuggestionChip,
  FilterChip,
  Text as ComposeText,
  Column,
  Card,
  LazyColumn,
  FlowRow,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';
import { Alert } from 'react-native';

export default function ChipScreen() {
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>(['All']);
  const [inputChips, setInputChips] = React.useState(['Work', 'Travel', 'News']);

  const handleFilterToggle = (filter: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  const handleInputDismiss = (chipLabel: string) => {
    setInputChips((prev) => prev.filter((chip) => chip !== chipLabel));
  };

  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Assist chips</ComposeText>
            <ComposeText>Help users complete actions and primary tasks.</ComposeText>
            <FlowRow horizontalArrangement={{ spacedBy: 8 }}>
              <AssistChip
                label="Book"
                leadingIcon="filled.Add"
                onPress={() => Alert.alert('Assist', 'Opening flight booking...')}
              />
              <AssistChip
                label="Calendar"
                leadingIcon="filled.DateRange"
                trailingIcon="filled.ArrowForward"
                onPress={() => Alert.alert('Assist', 'Adding to calendar...')}
              />
              <AssistChip
                label="Share"
                leadingIcon="filled.Share"
                onPress={() => Alert.alert('Assist', 'Sharing location...')}
              />
              <AssistChip label="Disabled" leadingIcon="filled.Lock" enabled={false} />
            </FlowRow>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Filter chips</ComposeText>
            <ComposeText>Help users refine and filter content.</ComposeText>
            <FlowRow horizontalArrangement={{ spacedBy: 8 }}>
              <FilterChip
                label="All"
                selected={selectedFilters.includes('All')}
                onPress={() => handleFilterToggle('All')}
              />
              <FilterChip
                label="Images"
                selected={selectedFilters.includes('Images')}
                onPress={() => handleFilterToggle('Images')}
              />
              <FilterChip
                label="Docs"
                selected={selectedFilters.includes('Docs')}
                onPress={() => handleFilterToggle('Docs')}
              />
              <FilterChip
                label="Videos"
                selected={selectedFilters.includes('Videos')}
                onPress={() => handleFilterToggle('Videos')}
              />
              <FilterChip label="Disabled" selected={false} enabled={false} />
            </FlowRow>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Input chips</ComposeText>
            <ComposeText>Represent user input that can be dismissed.</ComposeText>
            <FlowRow horizontalArrangement={{ spacedBy: 8 }}>
              {inputChips.map((chipLabel) => (
                <InputChip
                  key={chipLabel}
                  label={chipLabel}
                  onPress={() => handleInputDismiss(chipLabel)}
                />
              ))}
            </FlowRow>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Suggestion chips</ComposeText>
            <ComposeText>Offer contextual suggestions and recommendations.</ComposeText>
            <FlowRow horizontalArrangement={{ spacedBy: 8 }}>
              <SuggestionChip
                label="Dark Mode"
                onPress={() => Alert.alert('Suggestion', 'Applying dark mode...')}
              />
              <SuggestionChip
                label="Nearby"
                leadingIcon="filled.LocationOn"
                onPress={() => Alert.alert('Suggestion', 'Searching nearby...')}
              />
              <SuggestionChip
                label="Photos"
                leadingIcon="filled.Star"
                onPress={() => Alert.alert('Suggestion', 'Adding photos...')}
              />
            </FlowRow>
          </Column>
        </Card>
      </LazyColumn>
    </Host>
  );
}

ChipScreen.navigationOptions = {
  title: 'Chip',
};
