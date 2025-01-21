import { H4 } from '@expo/html-elements';
import { Button, ButtonProps } from '@expo/ui';
import * as React from 'react';
import { Platform, FlatList, ScrollView, View, StyleSheet } from 'react-native';

import { Page } from '../../components/Page';

function ButtonRenderItem(props: ButtonProps) {
  return (
    <Button
      style={styles.buttonStyle}
      onButtonPressed={() => {
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
    buttonStyle: 'bordered',
  },
  {
    text: 'Borderless',
    buttonStyle: 'borderless',
  },
];

if (Platform.OS === 'ios') {
  buttonStylesData.push(
    {
      text: 'Bordered Prominent',
      buttonStyle: 'borderedProminent',
    },
    {
      text: 'Plain',
      buttonStyle: 'plain',
    }
  );
}

if (Platform.OS === 'android') {
  buttonStylesData.push(
    {
      text: 'Outlined',
      buttonStyle: 'outlined',
    },
    {
      text: 'Elevated',
      buttonStyle: 'elevated',
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
    buttonRole: 'default',
  },
  {
    text: 'Cancel',
    buttonRole: 'cancel',
  },
  {
    text: 'Destructive',
    buttonRole: 'destructive',
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
