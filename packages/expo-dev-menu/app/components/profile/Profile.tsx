import React, { useContext } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import DevMenuContext from '../../DevMenuContext';
import { useMyProfileQuery } from '../../api/MyProfileQuery';
import Colors from '../../constants/Colors';
import ListItemButton from '../ListItemButton';
import Loading from '../Loading';
import { StyledText } from '../Text';
import { StyledView } from '../Views';

function ProfileHeader({ data }) {
  const { firstName, lastName, username, profilePhoto, isLegacy } = data.user;

  if (isLegacy) {
    // Legacy Header
    return (
      <View style={styles.header}>
        <View
          style={[styles.headerAvatar, styles.headerAvatarContainer, styles.legacyHeaderAvatar]}
        />
        <View style={styles.headerAccountsList}>
          <Text style={styles.headerAccountText}>@{username}</Text>
        </View>
      </View>
    );
  }

  return (
    <StyledView
      style={styles.header}
      lightBackgroundColor={Colors.light.secondaryBackground}
      lightBorderColor={Colors.light.border}
      darkBackgroundColor={Colors.dark.secondaryBackground}
      darkBorderColor={Colors.dark.border}>
      <View style={styles.headerAvatarContainer}>
        <Image style={styles.headerAvatar} source={{ uri: profilePhoto }} />
      </View>
      <StyledText style={styles.headerFullNameText}>
        {firstName} {lastName}
      </StyledText>
      <View style={styles.headerAccountsList}>
        <StyledText style={styles.headerAccountText} lightColor="#232B3A" darkColor="#ccc">
          @{username}
        </StyledText>
      </View>
    </StyledView>
  );
}

export default function Profile() {
  const context = useContext(DevMenuContext);
  const query = useMyProfileQuery();
  const { loading, error, data } = query;

  if (!loading && (error || !data.user)) {
    context.setSession(null);
    return <Loading />;
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <View>
      <ProfileHeader {...{ data }} />
      <ListItemButton
        name="Sign out"
        label="Sign out"
        icon="logout"
        onPress={async () => {
          await context.setSession(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  headerAvatarContainer: {
    marginTop: 25,
    marginBottom: 12,
    overflow: 'hidden',
    borderRadius: 5,
  },
  headerAvatar: {
    height: 64,
    width: 64,
    borderRadius: 5,
  },
  legacyHeaderAvatar: {
    backgroundColor: '#eee',
  },
  headerAccountsList: {
    paddingBottom: 20,
  },
  headerAccountText: {
    fontSize: 14,
  },
  headerFullNameText: {
    fontSize: 20,
    fontWeight: '500',
  },
});
