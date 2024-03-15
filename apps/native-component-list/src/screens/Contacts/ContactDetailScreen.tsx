import Ionicons from '@expo/vector-icons/Ionicons';
import * as Contacts from 'expo-contacts';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import * as React from 'react';
import { Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ContactDetailList, { DetailListItem } from './ContactDetailList';
import * as ContactUtils from './ContactUtils';
import ContactsAvatar from './ContactsAvatar';
import HeaderContainerRight from '../../components/HeaderContainerRight';
import HeaderIconButton from '../../components/HeaderIconButton';
import Colors from '../../constants/Colors';
import usePermissions from '../../utilities/usePermissions';

const isIos = Platform.OS === 'ios';

async function getPermissionAsync() {
  const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Linking.openSettings();
    return false;
  }
  return true;
}

export default function ContactDetailScreen(props: any) {
  React.useLayoutEffect(() => {
    props.navigation.setOptions({
      title: 'Contacts',
      headerRight: () => (
        <HeaderContainerRight>
          <HeaderIconButton
            name="share"
            onPress={async () => {
              Contacts.shareContactAsync(props.route.params.id, 'Call me :]');
            }}
          />
          <HeaderIconButton
            name="open"
            onPress={async () => {
              await Contacts.presentFormAsync(props.route.params.id);
              console.log('the native contact form has been closed');
            }}
          />
          {isIos && (
            <HeaderIconButton
              name="copy"
              onPress={async () => {
                await ContactUtils.cloneAsync(props.route.params.id);
                props.navigation.goBack();
              }}
            />
          )}
        </HeaderContainerRight>
      ),
    });
  }, [props.navigation]);

  const [permission] = usePermissions(Contacts.requestPermissionsAsync);

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text>No Contact Permission</Text>
      </View>
    );
  }

  return <ContactDetailView navigation={props.navigation} route={props.route} />;
}

function ContactDetailView({
  navigation,
  route: {
    params: { id },
  },
}: any) {
  const [contact, setContact] = React.useState<Contacts.Contact | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadAsync = async () => {
    setRefreshing(true);
    const contact = await Contacts.getContactByIdAsync(id);
    setContact(contact ?? null);
    setRefreshing(false);
  };

  const deleteAsync = async () => {
    try {
      await Contacts.removeContactAsync(id);
      navigation.goBack();
    } catch ({ message }) {
      console.error(message);
    }
  };

  const jobTitle = React.useMemo<string | null>(() => {
    if (!contact) return null;
    const { jobTitle, department } = contact;
    if (!jobTitle || !department) {
      return jobTitle ?? department ?? null;
    }
    return `${jobTitle} - ${department}`;
  }, [contact]);

  const subtitles = React.useMemo<string[]>(() => {
    if (!contact) return [];

    return [
      contact.phoneticFirstName,
      contact.nickname,
      contact.maidenName,
      jobTitle,
      contact.company,
    ].filter(Boolean) as string[];
  }, [jobTitle, contact]);

  const links = React.useMemo<any[]>(() => {
    if (!contact) return [];

    const phone = ContactUtils.getPrimary<Contacts.PhoneNumber>(contact.phoneNumbers ?? []);
    const email = ContactUtils.getPrimary<Contacts.Email>(contact.emails ?? []);

    return [
      { icon: 'text', text: 'message', format: 'sms', uri: phone?.number },
      { icon: 'call', text: 'call', format: 'tel', uri: phone?.number },
      { icon: 'videocam', text: 'video', format: 'facetime', uri: email?.email },
      { icon: 'mail', text: 'mail', format: 'mailto', uri: email?.email },
      { icon: 'cash', text: 'pay', format: 'shoebox', uri: email?.email },
    ];
  }, [contact]);

  const items = React.useMemo<
    {
      title: string;
      data: DetailListItem[];
    }[]
  >(() => {
    if (!contact) return [];

    const items = [];
    for (const key of Object.keys(contact)) {
      const value = (contact as any)[key];
      if (Array.isArray(value) && value.length > 0) {
        const data: DetailListItem[] = value.map((item) => {
          let transform: Partial<DetailListItem> = {};
          switch (key) {
            case Contacts.Fields.Relationships:
              transform = {
                value: item.name,
              };
              break;
            case Contacts.Fields.PhoneNumbers:
              transform = {
                value: item.number,
                onPress: () => Linking.openURL(`tel:${item.number}`),
              };
              break;
            case Contacts.Fields.SocialProfiles:
              transform = {
                value: item.username,
                label: item.label || item.localizedService,
              };
              break;
            case Contacts.Fields.UrlAddresses:
              transform = {
                value: item.url,
                onPress: () => {
                  const webUrl = item.url.indexOf('://') === -1 ? 'https://' + item.url : item.url;
                  console.log('open', item.url, webUrl);
                  Linking.openURL(webUrl);
                },
              };
              break;
            case Contacts.Fields.Dates:
              transform = {
                value: ContactUtils.parseDate(item).toDateString(),
              };
              break;
            case Contacts.Fields.Emails:
              transform = {
                value: item.email,
                onPress: () => Linking.openURL(encodeURI(`mailto:${item.email}`)),
              };
              break;
            case Contacts.Fields.Addresses:
              {
                const address = ContactUtils.parseAddress(item);
                const targetUriAdress = encodeURI(address);
                transform = {
                  value: address,
                  onPress: () =>
                    Linking.openURL(
                      Platform.select<string>({
                        ios: `https://maps.apple.com/maps?daddr=${targetUriAdress}`,
                        default: `https://maps.google.com/maps?daddr=${targetUriAdress}`,
                      })
                    ),
                };
              }
              break;
            case Contacts.Fields.InstantMessageAddresses:
              transform = {
                value: item.username,
              };
              break;
            default:
              break;
          }
          return {
            type: key,
            ...item,
            ...transform,
          };
        });
        items.push({
          title: ContactUtils.parseKey(key) ?? 'unknown',
          data,
        });
      }
    }
    return items;
  }, [contact]);

  const onPressImage = async () => {
    if (!isIos) {
      return;
    }
    _selectPhoto();
  };

  React.useEffect(() => {
    loadAsync();
  }, []);

  const _setNewPhoto = async (uri: string) => {
    // console.log(this.id, this.state.contact, uri);
    try {
      await Contacts.updateContactAsync({
        [Contacts.Fields.ID]: id,
        [Contacts.Fields.Image]: uri,
      } as any);
    } catch ({ message }) {
      console.error(message);
    }

    loadAsync();
  };

  const _selectPhoto = async () => {
    const permission = await getPermissionAsync();
    if (!permission) {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      _setNewPhoto(result.assets[0].uri);
    }
  };

  const renderListHeaderComponent = () => {
    return (
      <View style={styles.header}>
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <ContactsAvatar
            style={styles.image}
            onPress={onPressImage}
            name={contact?.name ?? ''}
            image={contact?.image?.uri}
          />
          <Text style={styles.name}>{contact?.name}</Text>

          {subtitles.map((subtitle, index) => (
            <Text key={index} style={styles.subtitle}>
              {subtitle}
            </Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {links.map((linkedItem, index) => (
            <LinkedButton {...linkedItem} key={index} />
          ))}
        </View>
      </View>
    );
  };

  const renderListFooterComponent = () => (
    <Text onPress={deleteAsync} style={styles.footer}>
      Delete Contact
    </Text>
  );

  if (!contact) {
    return <View />;
  }

  return (
    <View style={styles.container}>
      <ContactDetailList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadAsync} />}
        ListFooterComponent={renderListFooterComponent}
        ListHeaderComponent={renderListHeaderComponent}
        sections={items}
      />
    </View>
  );
}

function LinkedButton({
  text,
  icon,
  uri,
  format,
}: {
  uri?: string | null;
  format: string;
  text: string;
  icon: string;
}) {
  const enabled = !!uri;
  const color = enabled ? 'white' : 'gray';
  const backgroundColor = enabled ? Colors.tintColor : 'transparent';

  const onPress = () => Linking.openURL(`${format}:${encodeURIComponent(uri ?? '')}`);

  return (
    <TouchableOpacity disabled={!enabled} onPress={onPress}>
      <View
        style={[
          styles.linkButton,
          {
            backgroundColor,
          },
        ]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={[styles.linkButtonText, { color: backgroundColor }]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginVertical: 10,
  },
  container: {
    flex: 1,
    alignItems: 'stretch',
  },
  contactRow: {
    marginBottom: 12,
  },
  image: {
    marginVertical: 16,
  },
  name: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    opacity: 0.8,
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 2,
  },
  linkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',

    justifyContent: 'center',
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: 10,
    textAlign: 'center',
  },
  footer: {
    width: '100%',
    padding: 24,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'red',
  },
  header: {
    paddingHorizontal: 36,
    paddingVertical: 16,
    flex: 1,
    alignItems: 'stretch',
    backgroundColor: Colors.greyBackground,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
