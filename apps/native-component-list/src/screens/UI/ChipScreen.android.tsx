import {
  Host,
  AssistChip,
  InputChip,
  SuggestionChip,
  FilterChip,
  Icon,
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
              <AssistChip onClick={() => Alert.alert('Assist', 'Opening flight booking...')}>
                <AssistChip.Label>
                  <ComposeText>Book</ComposeText>
                </AssistChip.Label>
                <AssistChip.LeadingIcon>
                  <Icon source={require('../../../assets/icons/ui/add.xml')} size={18} />
                </AssistChip.LeadingIcon>
              </AssistChip>
              <AssistChip onClick={() => Alert.alert('Assist', 'Adding to calendar...')}>
                <AssistChip.Label>
                  <ComposeText>Calendar</ComposeText>
                </AssistChip.Label>
              </AssistChip>
              <AssistChip onClick={() => Alert.alert('Assist', 'Sharing location...')}>
                <AssistChip.Label>
                  <ComposeText>Share</ComposeText>
                </AssistChip.Label>
              </AssistChip>
              <AssistChip enabled={false}>
                <AssistChip.Label>
                  <ComposeText>Disabled</ComposeText>
                </AssistChip.Label>
              </AssistChip>
            </FlowRow>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Filter chips</ComposeText>
            <ComposeText>Help users refine and filter content.</ComposeText>
            <FlowRow horizontalArrangement={{ spacedBy: 8 }}>
              {['All', 'Images', 'Docs', 'Videos'].map((filter) => (
                <FilterChip
                  key={filter}
                  selected={selectedFilters.includes(filter)}
                  onClick={() => handleFilterToggle(filter)}>
                  <FilterChip.Label>
                    <ComposeText>{filter}</ComposeText>
                  </FilterChip.Label>
                </FilterChip>
              ))}
              <FilterChip selected={false} enabled={false}>
                <FilterChip.Label>
                  <ComposeText>Disabled</ComposeText>
                </FilterChip.Label>
              </FilterChip>
            </FlowRow>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Input chips</ComposeText>
            <ComposeText>Represent user input that can be dismissed.</ComposeText>
            <FlowRow horizontalArrangement={{ spacedBy: 8 }}>
              {inputChips.map((chipLabel) => (
                <InputChip key={chipLabel} selected onClick={() => handleInputDismiss(chipLabel)}>
                  <InputChip.Label>
                    <ComposeText>{chipLabel}</ComposeText>
                  </InputChip.Label>
                  <InputChip.Avatar>
                    <Icon source={require('../../../assets/icons/ui/person.xml')} size={18} />
                  </InputChip.Avatar>
                  <InputChip.TrailingIcon>
                    <Icon source={require('../../../assets/icons/ui/close.xml')} size={18} />
                  </InputChip.TrailingIcon>
                </InputChip>
              ))}
            </FlowRow>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Suggestion chips</ComposeText>
            <ComposeText>Offer contextual suggestions and recommendations.</ComposeText>
            <FlowRow horizontalArrangement={{ spacedBy: 8 }}>
              <SuggestionChip onClick={() => Alert.alert('Suggestion', 'Applying dark mode...')}>
                <SuggestionChip.Label>
                  <ComposeText>Dark Mode</ComposeText>
                </SuggestionChip.Label>
              </SuggestionChip>
              <SuggestionChip onClick={() => Alert.alert('Suggestion', 'Searching nearby...')}>
                <SuggestionChip.Label>
                  <ComposeText>Nearby</ComposeText>
                </SuggestionChip.Label>
              </SuggestionChip>
              <SuggestionChip onClick={() => Alert.alert('Suggestion', 'Adding photos...')}>
                <SuggestionChip.Label>
                  <ComposeText>Photos</ComposeText>
                </SuggestionChip.Label>
              </SuggestionChip>
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
