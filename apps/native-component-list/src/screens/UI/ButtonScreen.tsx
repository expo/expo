import { H4 } from '@expo/html-elements';
import { Button, ButtonProps } from '@expo/ui/components/Button';
import * as React from 'react';
import { Platform, FlatList, ScrollView, View, StyleSheet } from 'react-native';

import { Page } from '../../components/Page';

function ButtonRenderItem(props: ButtonProps) {
  return (
    <Button
      style={styles.buttonStyle}
      onPress={() => {
        console.log('Button pressed');
      }}
      {...props}
    />
  );
}

function ButtonDemoFlatList(props: { title: string; data: ButtonProps[] }) {
  return (
    <View style={styles.stretch}>
      <H4>{props.title}</H4>
      <FlatList
        data={props.data}
        renderItem={({ item }) => <ButtonRenderItem {...item} />}
        scrollEnabled={false}
        style={styles.stretch}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
      />
    </View>
  );
}

const defaultButton: ButtonProps[] = [
  {
    text: 'Default button',
  },
];

const buttonStylesData: ButtonProps[] = [
  {
    text: 'Default',
  },
  {
    text: 'Bordered',
    variant: 'bordered',
  },
  {
    text: 'Borderless',
    variant: 'borderless',
  },
];

if (Platform.OS === 'ios') {
  buttonStylesData.push(
    {
      text: 'Bordered Prominent',
      variant: 'borderedProminent',
    },
    {
      text: 'Plain',
      variant: 'plain',
    }
  );
}

if (Platform.OS === 'android') {
  buttonStylesData.push(
    {
      text: 'Outlined',
      variant: 'outlined',
    },
    {
      text: 'Elevated',
      variant: 'elevated',
    }
  );
}

const buttonImagesData: ButtonProps[] = [
  {
    text: 'Folder',
    systemImage: 'folder.badge.plus',
  },
  {
    text: 'Tortoise',
    systemImage: 'tortoise.fill',
  },
  {
    text: 'Trash',
    systemImage: 'trash',
  },
  {
    text: 'Heart',
    systemImage: 'heart.fill',
  },
];

const buttonRolesData: ButtonProps[] = [
  {
    text: 'Default',
    role: 'default',
  },
  {
    text: 'Cancel',
    role: 'cancel',
  },
  {
    text: 'Destructive',
    role: 'destructive',
  },
];

export default function UIScreen() {
  return (
    <Page>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ButtonDemoFlatList title="Default" data={defaultButton} />
        <ButtonDemoFlatList title="System Styles" data={buttonStylesData} />
        {Platform.OS === 'ios' && (
          <ButtonDemoFlatList title="System Images (Apple only)" data={buttonImagesData} />
        )}
        {Platform.OS === 'ios' && (
          <ButtonDemoFlatList title="Button Roles (Apple only)" data={buttonRolesData} />
        )}
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  buttonStyle: {
    width: 150,
    height: 50,
    margin: 5,
    overflow: 'visible',
  },
  stretch: {
    alignSelf: 'stretch',
  },
  columnWrapper: {
    justifyContent: 'space-around',
    alignContent: 'space-around',
  },
});
