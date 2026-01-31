import { DockedSearchBar, Icon, Text } from '@expo/ui/jetpack-compose';
import { type ExpoModifier } from '@expo/ui/jetpack-compose/modifiers';

interface LanguageSearchBarProps {
  onQueryChange: (query: string) => void;
  modifiers?: ExpoModifier[];
}

export function LanguageSearchBar({ onQueryChange, modifiers }: LanguageSearchBarProps) {
  return (
    <DockedSearchBar onQueryChange={onQueryChange} modifiers={modifiers}>
      <DockedSearchBar.Placeholder>
        <Text>Search languages</Text>
      </DockedSearchBar.Placeholder>
      <DockedSearchBar.LeadingIcon>
        <Icon source={require('@/assets/symbols/search.xml')} tintColor="#000000" />
      </DockedSearchBar.LeadingIcon>
    </DockedSearchBar>
  );
}
