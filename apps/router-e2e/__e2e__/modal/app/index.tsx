import { Link, Modal, Stack } from 'expo-router';
import { useState } from 'react';
import { Button, Text, View } from 'react-native';

export default function Index() {
  const [isOpenA, setIsOpenA] = useState(false);
  const [isOpenB, setIsOpenB] = useState(false);
  const [isOpenC, setIsOpenC] = useState(false);
  const [isOpenD, setIsOpenD] = useState(false);

  const openButtons = (
    <View style={{ gap: 8 }}>
      <Button
        title="Open Modal A"
        onPress={() => {
          setIsOpenA(true);
        }}
      />
      <Button
        title="Open Modal B"
        onPress={() => {
          setIsOpenB(true);
        }}
      />
      <Button
        title="Open Modal C"
        onPress={() => {
          setIsOpenC(true);
        }}
      />
      <Button
        title="Open Modal D"
        onPress={() => {
          setIsOpenD(true);
        }}
      />
    </View>
  );

  const closeButtons = (
    <View style={{ gap: 8, marginTop: 16 }}>
      <Button
        title="Close Modal A"
        onPress={() => {
          setIsOpenA(false);
        }}
      />
      <Button
        title="Close Modal B"
        onPress={() => {
          setIsOpenB(false);
        }}
      />
      <Button
        title="Close (unmount) Modal C"
        onPress={() => {
          setIsOpenC(false);
        }}
      />
      <Button
        title="Close (unmount) Modal D"
        onPress={() => {
          setIsOpenD(false);
        }}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Index</Text>
      <Link href="/modal" style={{ marginVertical: 12, fontSize: 16 }}>
        Link to Modal
      </Link>
      {openButtons}

      <Modal
        visible={isOpenA}
        onClose={() => {
          setIsOpenA(false);
        }}
        animationType="slide"
        presentationStyle="pageSheet"
        style={{
          backgroundColor: '#C2FBEF',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
        }}>
        <Text>Modal A</Text>
        {openButtons}
        {closeButtons}
      </Modal>
      <Modal
        visible={isOpenB}
        onClose={() => {
          setIsOpenB(false);
        }}
        animationType="slide"
        presentationStyle="pageSheet"
        style={{
          flex: 1,
          backgroundColor: '#7DAA92',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text>Modal B</Text>
        {openButtons}
        {closeButtons}
      </Modal>
      {isOpenC && (
        <Modal
          visible={isOpenC}
          onClose={() => {
            setIsOpenC(false);
          }}
          animationType="fade"
          presentationStyle="formSheet"
          style={{
            flex: 1,
            backgroundColor: '#BA7978',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Text>Modal C - formSheet</Text>
          {openButtons}
          {closeButtons}
        </Modal>
      )}
      {isOpenD && (
        <Modal
          visible={isOpenD}
          onClose={() => {
            setIsOpenD(false);
          }}
          animationType="slide"
          presentationStyle="overFullScreen"
          transparent
          style={{
            backgroundColor: '#00CCAD',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Text>Modal D</Text>
          {openButtons}
          {closeButtons}
        </Modal>
      )}
    </View>
  );
}
