import Fuse from 'fuse.js';
import React from 'react';
import { StyleSheet, View, TextInput } from 'react-native';

import {
  DevMenuItemProps,
  DevMenuSelectionListItem,
  DevMenuSelectionListItemTag,
  DevMenuSelectionListType,
} from '../../DevMenuInternal';
import Colors from '../../constants/Colors';
import { Ionicon } from '../Icon';
import ListItemCheckbox from '../ListItemCheckbox';
import { StyledText } from '../Text';
import { StyledView } from '../Views';

type State = {
  searchText: string;
};

const SearchBar = ({ onChangeText }: { onChangeText: (text: string) => void }) => {
  return (
    <StyledView
      style={styles.searchContainer}
      lightBackgroundColor={Colors.light.background}
      darkBackgroundColor={Colors.dark.background}>
      <TextInput
        onChangeText={onChangeText}
        style={styles.search}
        placeholder="Search"
        placeholderTextColor="#90909d"
      />
    </StyledView>
  );
};

const SectionItemTag = ({ glyphName, text }: DevMenuSelectionListItemTag) => {
  return (
    <StyledView
      lightBackgroundColor={Colors.light.background}
      darkBackgroundColor={Colors.dark.background}
      lightBorderColor={Colors.light.border}
      darkBorderColor={Colors.dark.border}
      style={styles.tag}>
      <View style={styles.tagIcon}>
        <Ionicon size={14} name={glyphName} color="tint" />
      </View>

      <StyledText
        lightColor={Colors.light.secondaryText}
        darkColor={Colors.dark.secondaryText}
        style={styles.tagText}>
        {text}
      </StyledText>
    </StyledView>
  );
};

const SectionItem = ({ title, isChecked, warning, tags }: DevMenuSelectionListItem) => {
  const tagsComponents = tags?.map(tag => <SectionItemTag key={tag.text} {...tag} />) ?? [];

  const element = (
    <View style={styles.itemContainer}>
      <StyledText
        lightColor={Colors.light.menuItemText}
        darkColor={Colors.dark.menuItemText}
        style={styles.sectionItem}>
        {title}
      </StyledText>

      {tagsComponents.length > 0 && <View style={styles.tagsContainer}>{tagsComponents}</View>}

      {warning && (
        <StyledView
          style={styles.warningContainer}
          lightBackgroundColor={Colors.light.warningBackground}
          lightBorderColor={Colors.light.warningBorders}
          darkBackgroundColor={Colors.dark.warningBackground}
          darkBorderColor={Colors.dark.warningBorders}>
          <StyledText
            style={styles.warning}
            lightColor={Colors.light.warningColor}
            darkColor={Colors.dark.warningColor}>
            {warning}
          </StyledText>
        </StyledView>
      )}
    </View>
  );

  return <ListItemCheckbox content={element} initialChecked={isChecked} />;
};

const SectionDivider = () => {
  return (
    <StyledView
      darkBackgroundColor={Colors.dark.border}
      lightBackgroundColor={Colors.light.border}
      style={{
        height: 1,
      }}
    />
  );
};

const SearchResults = ({
  query,
  elements,
}: {
  query: string;
  elements: DevMenuSelectionListItem[];
}) => {
  const fuse = new Fuse(elements, {
    keys: ['title', 'tags.text'],
  });
  const results = fuse.search(query);

  return (
    <>
      <StyledText
        lightColor={Colors.light.menuItemText}
        darkColor={Colors.dark.menuItemText}
        style={styles.sectionHeader}>
        {results.length === 0 ? 'No results' : 'Results'}
      </StyledText>

      {results.map(({ item }) => (
        <SectionItem
          key={item.title}
          title={item.title}
          warning={item?.warning}
          isChecked={item?.isChecked}
          tags={item.tags}
        />
      ))}
    </>
  );
};

const AllItems = ({ elements }: { elements: DevMenuSelectionListItem[] }) => {
  const selectedElements = elements.filter(e => e.isChecked);
  const othersElements = elements.filter(e => !e.isChecked);
  return (
    <>
      <StyledText
        lightColor={Colors.light.menuItemText}
        darkColor={Colors.dark.menuItemText}
        style={styles.sectionHeader}>
        Current development client release
      </StyledText>
      <SectionDivider />
      {selectedElements.map(e => (
        <SectionItem
          key={e.title}
          title={e.title}
          warning={e?.warning}
          isChecked={e.isChecked}
          tags={e.tags}
        />
      ))}

      <StyledText
        lightColor={Colors.light.menuItemText}
        darkColor={Colors.dark.menuItemText}
        style={styles.sectionHeader}>
        Recently updated release
      </StyledText>
      <SectionDivider />
      {othersElements.map(e => (
        <SectionItem
          key={e.title}
          title={e.title}
          warning={e?.warning}
          isChecked={e.isChecked}
          tags={e.tags}
        />
      ))}
    </>
  );
};

class DevMenuSelectionList extends React.PureComponent<
  DevMenuItemProps<DevMenuSelectionListType>,
  State
> {
  state = {
    searchText: '',
  };

  onChangeText = (text: string) => {
    this.setState({
      searchText: text,
    });
  };

  render() {
    const { items } = this.props.item;

    const isSearchActive = this.state.searchText.length > 0;

    return (
      <StyledView>
        <SearchBar onChangeText={this.onChangeText} />
        {isSearchActive ? (
          <SearchResults query={this.state.searchText} elements={items} />
        ) : (
          <AllItems elements={items} />
        )}
      </StyledView>
    );
  }
}

const styles = StyleSheet.create({
  searchContainer: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  search: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#ebebed',
    fontSize: 18,
  },

  tagsContainer: {
    flexDirection: 'row',
    marginTop: -4,
    marginBottom: 10,
  },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginRight: 8,
    flexDirection: 'row',
    alignSelf: 'center',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagIcon: { marginRight: 5 },
  tagText: {
    fontSize: 14,
  },

  sectionHeader: {
    marginTop: 18,
    paddingHorizontal: 20,
    marginBottom: 5,
    fontWeight: '700',
    fontSize: 14,
  },
  sectionItem: {
    fontSize: 15,
    paddingVertical: 10,
  },

  itemContainer: {
    flexShrink: 1,
  },

  warningContainer: {
    marginTop: 4,
    padding: 10,
    borderWidth: 1,
    marginBottom: 10,
    maxWidth: '95%',
  },
  warning: { fontSize: 14 },
});

export default DevMenuSelectionList;
