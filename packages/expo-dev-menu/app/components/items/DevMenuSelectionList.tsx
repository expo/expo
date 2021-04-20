import Fuse from 'fuse.js';
import React from 'react';
import { StyleSheet, View, TextInput } from 'react-native';

import {
  DevMenuItemProps,
  DevMenuSelectionListItem,
  DevMenuSelectionListItemTag,
  DevMenuSelectionListType,
  fetchDataSourceAsync,
  dispatchCallableAsync,
} from '../../DevMenuInternal';
import Colors from '../../constants/Colors';
import { Ionicon } from '../Icon';
import ListItemCheckbox from '../ListItemCheckbox';
import { StyledText } from '../Text';
import { StyledView } from '../Views';

type State = {
  searchText: string;
  items: DevMenuSelectionListItem[];
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

const SectionItem = ({
  title,
  isChecked,
  warning,
  tags,
  onClick,
  onClickData,
}: DevMenuSelectionListItem & { onClick: (object) => void }) => {
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

  return (
    <ListItemCheckbox
      content={element}
      initialChecked={isChecked}
      onChange={() => {
        onClick(onClickData);
      }}
    />
  );
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
  onClick,
}: {
  query: string;
  elements: DevMenuSelectionListItem[];
  onClick: (object) => void;
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
        <SectionItem key={item.title} {...item} onClick={onClick} />
      ))}
    </>
  );
};

const AllItems = ({
  elements,
  onClick,
}: {
  elements: DevMenuSelectionListItem[];
  onClick: (object) => void;
}) => {
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
        <SectionItem key={e.title} {...e} onClick={onClick} />
      ))}

      <StyledText
        lightColor={Colors.light.menuItemText}
        darkColor={Colors.dark.menuItemText}
        style={styles.sectionHeader}>
        Recently updated release
      </StyledText>
      <SectionDivider />
      {othersElements.map(e => (
        <SectionItem key={e.title} {...e} onClick={onClick} />
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
    items: this.props.item.items,
  };

  onChangeText = (text: string) => {
    this.setState({
      searchText: text,
    });
  };

  onItemClick = (args: object) => {
    const { functionId } = this.props.item;

    if (functionId) {
      dispatchCallableAsync(functionId, args);
    }
  };

  componentDidMount() {
    if (this.props.item.dataSourceId) {
      fetchDataSourceAsync(this.props.item.dataSourceId).then(items => {
        this.setState({
          items,
        });
      });
    }
  }

  render() {
    const { items } = this.state;

    const isSearchActive = this.state.searchText.length > 0;

    return (
      <StyledView>
        <SearchBar onChangeText={this.onChangeText} />
        {isSearchActive ? (
          <SearchResults
            query={this.state.searchText}
            elements={items}
            onClick={this.onItemClick}
          />
        ) : (
          <AllItems elements={items} onClick={this.onItemClick} />
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
