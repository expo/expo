/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import * as LogBoxStyle from '../UI/LogBoxStyle';

type Props = {
  heading: string;
  children: React.ReactNode;
  action?: any;
};

export function LogBoxInspectorSection(props: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text style={styles.headingText}>{props.heading}</Text>
        {props.action}
      </View>
      <View style={styles.body}>{props.children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 15,
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  headingText: {
    color: LogBoxStyle.getTextColor(1),
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    includeFontPadding: false,
    lineHeight: 20,
  },
  body: {
    paddingBottom: 10,
  },
});
