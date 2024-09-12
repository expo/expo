import { AudioRecorder } from 'expo-audio';
import { RecordingInput } from 'expo-av/build/Audio/Recording.types';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import ListButton from '../../../components/ListButton';

type Props = {
  recorder?: AudioRecorder;
};

function AudioInputSelector({ recorder }: Props) {
  const [availableInputs, setAvailableInputs] = useState<RecordingInput[]>([]);
  const [currentInput, setCurrentInput] = useState<RecordingInput | null>(null);

  const checkInputs = useCallback(async () => {
    if (recorder) {
      const availInputs = recorder.getAvailableInputs();
      setAvailableInputs(availInputs);
      const curtInput = recorder.getCurrentInput();
      setCurrentInput(curtInput);
    }
  }, [recorder]);

  useEffect(() => {
    checkInputs();
  }, [checkInputs]);

  return (
    <View>
      <Text>Recording Inputs:</Text>
      {availableInputs.length ? (
        availableInputs.map((input) => {
          const isSelected = input.uid === currentInput?.uid;
          const title = input.name;
          return (
            <ListButton
              key={`input-${input.uid}`}
              title={`${isSelected ? '✓ ' : ''}${title}`}
              onPress={async () => {
                recorder?.setInput(input.uid);
                checkInputs();
              }}
            />
          );
        })
      ) : (
        <Text>
          Inputs cannot be populated until a recording object is created. Begin recording to view
          inputs.
        </Text>
      )}
    </View>
  );
}

export default AudioInputSelector;
