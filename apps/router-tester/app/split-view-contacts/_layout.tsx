import { Link, useGlobalSearchParams, useRouter, type Href } from 'expo-router';
import { SplitView } from 'expo-router/unstable-split-view';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  PlatformColor,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Avatar,
  LISTS,
  MY_CARD,
  contactSections,
  findContact,
  fullName,
  type Contact,
} from '@/components/split-view-contacts';
import { useContentScreens } from '@/components/split-view-content-stack';

export default function Layout() {
  // Navigation does not reveal a column, so the selected column is shown with the split view commands.
  const splitRef = useRef<ComponentRef<typeof SplitView>>(null);
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [list, setList] = useState(LISTS[0]!);
  const [customLists, setCustomLists] = useState<string[]>([]);
  const [showLocalLists, setShowLocalLists] = useState(true);
  const [showTip, setShowTip] = useState(true);
  const [query, setQuery] = useState('');
  const [addCount, setAddCount] = useState(0);
  const { id } = useGlobalSearchParams<{ id?: string }>();
  const sections = contactSections(list, query);
  const contentScreens = useContentScreens('split-view-contacts');
  const showsIndex = contentScreens.at(-1) === 'index';

  // Collapsed, the index placeholder is not a page of its own: back from a card goes on to the list.
  useEffect(() => {
    if (collapsed && showsIndex) splitRef.current?.show('supplementary');
  }, [collapsed, showsIndex]);

  const addList = () => {
    Alert.prompt('Add List', 'Enter a name for this list.', (value) => {
      const name = value?.trim();
      if (name && !LISTS.includes(name)) {
        setCustomLists((names) => (names.includes(name) ? names : [...names, name]));
        setShowLocalLists(true);
      }
    });
  };

  const editList = () => {
    if (!customLists.includes(list)) {
      Alert.alert('Edit Lists', 'Select a list you added to rename it.');
      return;
    }
    Alert.prompt(
      'Rename List',
      undefined,
      (value) => {
        const name = value?.trim();
        if (name && !LISTS.includes(name) && !customLists.includes(name)) {
          setCustomLists((names) => names.map((item) => (item === list ? name : item)));
          setList(name);
        }
      },
      'plain-text',
      list
    );
  };

  const listRow = (name: string) => {
    const isAll = name === LISTS[0];
    const selected = !collapsed && name === list;
    const count = contactSections(name, '').reduce(
      (total, [, contacts]) => total + contacts.length,
      0
    );
    return (
      <Pressable
        key={name}
        accessibilityRole="button"
        accessibilityLabel={name}
        accessibilityValue={{ text: `${count} contacts` }}
        accessibilityState={{ selected }}
        style={[styles.listRow, collapsed && styles.groupedRow, selected && styles.selectedListRow]}
        onPress={() => {
          setList(name);
          // Close a card that is not in the new list. A card at the root cannot be popped, so
          // the placeholder is pushed over it. The effect above then shows the list column.
          const selected = showsIndex || !id ? undefined : findContact(id);
          if (selected && name !== LISTS[0] && !selected.lists.includes(name)) {
            if (contentScreens[0] === 'index') {
              router.dismissAll();
            } else {
              router.push('/split-view-contacts');
            }
          } else if (collapsed) {
            // When expanded, `show` would close the sidebar overlay.
            splitRef.current?.show('supplementary');
          }
        }}>
        {isAll && <SymbolView name="person.2.fill" size={20} tintColor={PlatformColor('label')} />}
        <Text style={styles.listTitle}>{name}</Text>
        <Text style={styles.secondary}>{count}</Text>
        {collapsed && (
          <SymbolView name="chevron.right" size={12} tintColor={PlatformColor('tertiaryLabel')} />
        )}
      </Pressable>
    );
  };

  const contactRow = (contact: Contact, myCard = false) => {
    const selected = !collapsed && !showsIndex && !myCard && contact.id === id;
    return (
      <Pressable
        key={contact.id}
        accessibilityRole="button"
        accessibilityLabel={myCard ? `${fullName(contact)}, My Card` : fullName(contact)}
        accessibilityState={{ selected }}
        style={[styles.contactRow, selected && styles.selectedContactRow]}
        onPress={() => {
          const href: Href = `/split-view-contacts/${contact.id}`;
          // screens v5 cannot replace the root screen of a stack (react-native-screens#5340),
          // and the placeholder stays below the cards, so a card opened from it is pushed.
          if (contentScreens.length > 1 && !showsIndex) {
            router.replace(href);
          } else {
            router.push(href);
          }
          splitRef.current?.show('secondary');
        }}>
        <Avatar contact={contact} size={48} />
        <View style={[styles.contactDetails, !myCard && !selected && styles.contactSeparator]}>
          <View style={styles.contactText}>
            <Text style={[styles.contactName, selected && styles.selectedText]}>
              {contact.firstName} <Text style={styles.lastName}>{contact.lastName}</Text>
            </Text>
            {myCard && <Text style={styles.secondary}>My Card</Text>}
          </View>
          {!myCard && contact.id === MY_CARD.id && (
            <Text style={[styles.secondary, selected && styles.selectedText]}>me</Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SplitView
      ref={splitRef}
      preferredDisplayMode="twoBesideSecondary"
      topColumnForCollapsing="supplementary"
      onCollapse={() => setCollapsed(true)}
      onExpand={() => setCollapsed(false)}>
      <SplitView.Column
        header={{
          title: 'Lists',
          ios: {
            leadingItems: [{ type: 'item', id: 'edit', title: 'Edit', onPress: editList }],
            trailingItems: collapsed
              ? [{ type: 'item', id: 'add-list', title: 'Add List', onPress: addList }]
              : undefined,
          },
        }}>
        <ScrollView
          style={styles.sidebar}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.sidebarContent}>
          {listRow(LISTS[0]!)}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showLocalLists }}
            style={styles.sectionHeader}
            onPress={() => setShowLocalLists((visible) => !visible)}>
            <Text style={styles.secondary}>On My iPad</Text>
            <SymbolView
              name={showLocalLists ? 'chevron.down' : 'chevron.right'}
              size={12}
              tintColor={PlatformColor('secondaryLabel')}
            />
          </Pressable>
          {showLocalLists && [...LISTS.slice(1), ...customLists].map(listRow)}
          {!collapsed && (
            <Pressable accessibilityRole="button" onPress={addList} style={styles.footerLink}>
              <Text style={styles.link}>Add List</Text>
            </Pressable>
          )}
          <Link
            testID="split-view-contacts-home"
            href="/"
            replace
            style={[styles.link, styles.footerLink]}>
            Back to home
          </Link>
        </ScrollView>
      </SplitView.Column>
      <SplitView.Column header={{ title: list === LISTS[0] ? 'Contacts' : list }}>
        <KeyboardAvoidingView behavior="padding" style={styles.contacts}>
          <ScrollView
            style={styles.contacts}
            testID="split-view-contacts-list"
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={styles.contactsContent}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled">
            {list === LISTS[0] && !query.trim() && (
              <>
                {contactRow(MY_CARD, true)}
                {showTip && (
                  <View style={styles.tip}>
                    <View style={styles.contactText}>
                      <Text style={styles.tipTitle}>Organize your contacts</Text>
                      <Text style={styles.secondary}>
                        Use Lists to find groups like Family and Work.
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Dismiss tip"
                      hitSlop={10}
                      onPress={() => setShowTip(false)}>
                      <SymbolView
                        name="xmark"
                        size={13}
                        tintColor={PlatformColor('secondaryLabel')}
                      />
                    </Pressable>
                  </View>
                )}
              </>
            )}
            {sections.map(([letter, contacts]) => (
              <View key={letter}>
                <Text style={styles.letter}>{letter}</Text>
                {contacts.map((contact) => contactRow(contact))}
              </View>
            ))}
            <Text style={styles.note}>
              {sections.reduce((count, [, contacts]) => count + contacts.length, 0)} contacts
              {query ? ` matching “${query}”` : ''}
            </Text>
          </ScrollView>
          {addCount > 0 && <Text style={styles.note}>Add pressed {addCount} times</Text>}
          <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
            <View style={styles.search}>
              <SymbolView
                name="magnifyingglass"
                size={17}
                tintColor={PlatformColor('secondaryLabel')}
              />
              <TextInput
                testID="split-view-contacts-search"
                accessibilityLabel="Search"
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor={PlatformColor('secondaryLabel')}
                value={query}
                onChangeText={setQuery}
                clearButtonMode="while-editing"
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add"
              style={styles.addButton}
              onPress={() => setAddCount((count) => count + 1)}>
              <SymbolView name="plus" size={20} tintColor={PlatformColor('label')} />
            </Pressable>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </SplitView.Column>
      <SplitView.Content stackIntegration />
    </SplitView>
  );
}

const styles = StyleSheet.create({
  sidebar: { backgroundColor: PlatformColor('systemGroupedBackground') },
  sidebarContent: { padding: 12, gap: 6 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
  },
  groupedRow: { backgroundColor: PlatformColor('secondarySystemGroupedBackground') },
  selectedListRow: { backgroundColor: PlatformColor('systemGray5') },
  listTitle: { flex: 1, fontSize: 17, color: PlatformColor('label') },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 14,
    minHeight: 40,
  },
  link: { fontSize: 15, color: PlatformColor('link') },
  footerLink: { paddingHorizontal: 14, paddingVertical: 12 },
  contacts: { flex: 1, backgroundColor: PlatformColor('systemBackground') },
  contactsContent: { paddingHorizontal: 12, paddingTop: 4 },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: PlatformColor('tertiarySystemFill'),
  },
  searchInput: { flex: 1, minHeight: 44, fontSize: 17, color: PlatformColor('label') },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PlatformColor('tertiarySystemFill'),
  },
  tip: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    padding: 14,
    borderRadius: 16,
    backgroundColor: PlatformColor('systemGroupedBackground'),
  },
  tipTitle: { fontSize: 16, fontWeight: '600', color: PlatformColor('label') },
  secondary: { fontSize: 15, color: PlatformColor('secondaryLabel') },
  letter: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingTop: 8,
    color: PlatformColor('secondaryLabel'),
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    borderRadius: 26,
  },
  selectedContactRow: { backgroundColor: PlatformColor('systemBlue') },
  contactDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 64,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'transparent',
  },
  contactSeparator: { borderTopColor: PlatformColor('separator') },
  contactText: { flex: 1 },
  contactName: { fontSize: 17, color: PlatformColor('label') },
  selectedText: { color: 'white' },
  lastName: { fontWeight: '700' },
  note: { padding: 12, textAlign: 'center', color: PlatformColor('secondaryLabel') },
});
