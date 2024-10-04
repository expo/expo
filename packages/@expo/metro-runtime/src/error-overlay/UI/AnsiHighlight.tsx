/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import Anser from 'anser';
import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';

// Afterglow theme from https://iterm2colorschemes.com/
const COLORS: Record<string, string> = {
  'ansi-black': 'rgb(27, 27, 27)',
  'ansi-red': 'rgb(187, 86, 83)',
  'ansi-green': 'rgb(144, 157, 98)',
  'ansi-yellow': 'rgb(234, 193, 121)',
  'ansi-blue': 'rgb(125, 169, 199)',
  'ansi-magenta': 'rgb(176, 101, 151)',
  'ansi-cyan': 'rgb(140, 220, 216)',
  // Instead of white, use the default color provided to the component
  // 'ansi-white': 'rgb(216, 216, 216)',
  'ansi-bright-black': 'rgb(98, 98, 98)',
  'ansi-bright-red': 'rgb(187, 86, 83)',
  'ansi-bright-green': 'rgb(144, 157, 98)',
  'ansi-bright-yellow': 'rgb(234, 193, 121)',
  'ansi-bright-blue': 'rgb(125, 169, 199)',
  'ansi-bright-magenta': 'rgb(176, 101, 151)',
  'ansi-bright-cyan': 'rgb(140, 220, 216)',
  'ansi-bright-white': 'rgb(247, 247, 247)',
};

export function Ansi({ text, style }: { text: string; style: StyleProp<TextStyle> }) {
  let commonWhitespaceLength = Infinity;
  const parsedLines = text.split(/\n/).map((line) =>
    Anser.ansiToJson(line, {
      json: true,
      remove_empty: true,
      use_classes: true,
    })
  );

  parsedLines.map((lines) => {
    // The third item on each line includes the whitespace of the source code.
    // We are looking for the least amount of common whitespace to trim all lines.
    // Example: Array [" ", " 96 |", "     text", ...]
    const match = lines[2] && lines[2]?.content?.match(/^ +/);
    const whitespaceLength = (match && match[0]?.length) || 0;
    if (whitespaceLength < commonWhitespaceLength) {
      commonWhitespaceLength = whitespaceLength;
    }
  });

  const getText = (content: string, key: number) => {
    if (key === 1) {
      // Remove the vertical bar after line numbers
      return content.replace(/\| $/, ' ');
    } else if (key === 2 && commonWhitespaceLength < Infinity) {
      // Remove common whitespace at the beginning of the line
      return content.substr(commonWhitespaceLength);
    } else {
      return content;
    }
  };

  return (
    <View>
      {parsedLines.map((items, i) => (
        <View style={styles.line} key={i}>
          {items.map((bundle, key) => {
            const textStyle =
              bundle.fg && COLORS[bundle.fg]
                ? {
                    backgroundColor: bundle.bg && COLORS[bundle.bg],
                    color: bundle.fg && COLORS[bundle.fg],
                  }
                : {
                    backgroundColor: bundle.bg && COLORS[bundle.bg],
                  };
            return (
              <Text style={[style, textStyle]} key={key}>
                {getText(bundle.content, key)}
              </Text>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    flexDirection: 'row',
  },
});
