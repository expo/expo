import { List } from '@expo/ui/components/List';
import { Label } from '@expo/ui/components/Label';

import * as React from 'react';
import {View} from 'react-native';
import { Section } from '@expo/ui/components/Section';
import { ScrollView } from 'react-native-gesture-handler';




export default function ListScreen() {
  return (
    <List 
    moveEnabled={true}
  style={{flex: 1}} 
  listStyle="sidebar" 
  data={[
    {text: "Good Morning", systemImage: "sun.max.fill"},
    {text: "Weather", systemImage: "cloud.sun.fill"},
    {text: "Settings", systemImage: "gearshape.fill"},
    {text: "Music", systemImage: "music.note"},
    {text: "Home", systemImage: "house.circle.fill"},
    {text: "Location", systemImage: "location.fill"},
    {text: "Profile", systemImage: "person.fill"}
  ]} 
  renderItem={({item}) => (
    <Label title={item.text} systemImage={item.systemImage} />
  )} 
/>



  );
}

ListScreen.navigationOptions = {
  title: 'List',
};




