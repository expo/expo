



import { ContentUnavailableView } from '@expo/ui/components/ContentUnavailable';
import * as React from 'react';


export default function ContentUnavailableScreen() {
  return (

    <ContentUnavailableView style={{flex: 1}} title='No results' systemImage='magnifyingglass' description="Maybe you made a typo" />

  );
}

ContentUnavailableScreen.navigationOptions = {
  title: 'ContentUnavailableView',
};
