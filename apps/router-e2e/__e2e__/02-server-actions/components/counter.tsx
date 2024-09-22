/// <reference types="react/canary" />
'use client';

import { useState } from 'react';
import { Text } from 'react-native';
import { addAsync } from './test-actions';

export const Counter = ({ onNestedAction, onRenderView }) => {
  return (
    <>
      <ActionAndResultButton onPress={addAsync.bind(null, 1, 2)} testID="add-button" />
      <ActionAndResultButton onPress={onNestedAction.bind(null, 1)} testID="nested-button" />
      <ActionAndResultButton onPress={onRenderView.bind(null, 'hello')} testID="jsx-button" />
    </>
  );
};

const ActionAndResultButton = ({
  onPress,
  testID,
}: {
  onPress: (...props: any[]) => Promise<string>;
  testID: string;
}) => {
  const [result, setResult] = useState<string>();

  return (
    <Text testID={testID} onPress={() => onPress().then(setResult)}>
      Press:{result}
    </Text>
  );
};
