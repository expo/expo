import { Ionicons } from '@expo/vector-icons';
import * as Boo from 'Boo';
import AppLoading from 'expo-app-loading';
import { Asset } from 'expo-asset';
import FooView from 'foo-view';
import InlineFuncFromPackage from 'inline-comp';
import React from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';
import 'Foo';

import './local-file/i-have-side-effects.fx.js';
import '../i-also-have-side-effects.fx';
import InlineFuncFromFile from './inline-func';
import InlineFuncFromFileWithSideEffects from '../inline-func-with-side-effects.fx.ts';

class Lazy extends React.Component {
  componentDidMount() {
    console.log('Calling InlineFuncFromPackage()');
    InlineFuncFromPackage();

    console.log('Calling InlineFuncFromFile()');
    InlineFuncFromFile();

    console.log('Calling Boo.myFunc()');
    Boo.myFunc();

    Asset.loadAsync([require('./assets/icon.png')]);
  }

  render() {
    return (
      <View>
        <AppLoading />
        <Ionicons name="md-options" size={28} />
        <FooView />
      </View>
    );
  }

  unusedFunction() {
    InlineFuncFromFileWithSideEffects();
  }
}

export default connect()(Lazy);
