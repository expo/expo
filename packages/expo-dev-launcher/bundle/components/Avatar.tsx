import { iconSize, palette } from '@expo/styleguide-native';
import { View, Image, scale, BuildingIcon, UserIcon } from 'expo-dev-client-components';
import React from 'react';
import { StyleSheet } from 'react-native';

type Props = {
  name?: string;
  profilePhoto?: string;
  isOrganization?: boolean;
  size?: React.ComponentProps<typeof Image>['size'];
};

export function Avatar({ profilePhoto, size = 'large', name = '', isOrganization = false }: Props) {
  const firstLetter = name?.charAt(0).toLowerCase();
  const viewSize = getViewSize(size);

  if (isOrganization) {
    const { backgroundColor, tintColor } = getOrganizationColor(firstLetter);
    return (
      <View
        style={{
          height: viewSize,
          width: viewSize,
          backgroundColor,
        }}
        rounded="full"
        align="centered"
        bg="secondary">
        <BuildingIcon resizeMode="center" style={styles.icon} tintColor={tintColor} />
      </View>
    );
  }

  if (!profilePhoto || !firstLetter) {
    return (
      <View
        style={{ height: viewSize, width: viewSize }}
        rounded="full"
        align="centered"
        bg="secondary">
        <UserIcon resizeMode="center" style={styles.icon} />
      </View>
    );
  }

  let _profilePhoto = profilePhoto;
  if (profilePhoto.match('gravatar.com')) {
    const defaultProfilePhoto = encodeURIComponent(
      `https://storage.googleapis.com/expo-website-default-avatars-2023/${firstLetter}.png`
    );
    _profilePhoto = `${profilePhoto}&d=${defaultProfilePhoto}`;
  }

  return (
    <View rounded="full" bg="secondary">
      <Image rounded="full" source={{ uri: _profilePhoto }} size={size} />
    </View>
  );
}

function getOrganizationColor(firstLetter?: string) {
  if (firstLetter?.match(/[a-d]/)) {
    return { backgroundColor: palette.light.blue[200], tintColor: palette.light.blue[900] };
  } else if (firstLetter?.match(/[e-h]/)) {
    return { backgroundColor: palette.light.green[200], tintColor: palette.light.green[900] };
  } else if (firstLetter?.match(/[i-l]/)) {
    return { backgroundColor: palette.light.yellow[400], tintColor: palette.light.yellow[900] };
  } else if (firstLetter?.match(/[m-p]/)) {
    return { backgroundColor: palette.light.orange[200], tintColor: palette.light.orange[900] };
  } else if (firstLetter?.match(/[q-t]/)) {
    return { backgroundColor: palette.light.red[200], tintColor: palette.light.red[900] };
  } else if (firstLetter?.match(/[u-z]/)) {
    return { backgroundColor: palette.light.pink[200], tintColor: palette.light.pink[900] };
  } else {
    return { backgroundColor: palette.light.purple[200], tintColor: palette.light.purple[900] };
  }
}

function getViewSize(size?: React.ComponentProps<typeof Image>['size']) {
  switch (size) {
    case 'tiny':
      return scale.small;
    case 'small':
      return iconSize.small;
    case 'large':
      return iconSize.large;
    case 'xl':
      return scale.xl;
    default:
      return iconSize.large;
  }
}

const styles = StyleSheet.create({
  icon: { width: '45%', height: '45%' },
});
