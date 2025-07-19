import { Link, Modal, Stack } from 'expo-router';
import { useState } from 'react';
import { Button, Pressable, ScrollView, Text, View } from 'react-native';

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
        detents={[0.25, 0.5, 0.75]}
        style={{
          backgroundColor: '#C2FBEF',
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
          detents={[0.5, 0.75, 0.8]}
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
      <FitForm />
    </View>
  );
}

function FitForm() {
  const [open, setIsOpen] = useState(false);
  const [count, setCount] = useState(1);
  return (
    <>
      <Button title="Open fitToContents" onPress={() => setIsOpen((open) => !open)} />
      <Modal
        visible={open}
        onClose={() => setIsOpen(false)}
        presentationStyle="formSheet"
        detents="fitToContents">
        <ScrollView
          style={{ gap: 8 }}
          contentContainerStyle={{
            padding: 16,
            gap: 8,
          }}
          automaticallyAdjustsScrollIndicatorInsets
          contentInsetAdjustmentBehavior="automatic">
          {Array.from({ length: count }).map((_, index) => (
            <View
              key={String(index)}
              style={{
                padding: 24,
                backgroundColor: '#ccc',
                borderRadius: 16,
                borderCurve: 'continuous',
              }}
            />
          ))}

          <View
            style={{
              gap: 4,
              flex: 1,
              flexDirection: 'row',
            }}>
            <MutateButton onPress={() => setCount((count) => count + 1)}>Add</MutateButton>
            <MutateButton onPress={() => setCount(Math.max(count - 1, 0))}>Remove</MutateButton>
          </View>
        </ScrollView>
      </Modal>
    </>
  );
}

function MutateButton({ onPress, children }: { onPress: () => void; children?: React.ReactNode }) {
  return (
    <Pressable style={{ display: 'contents' }} onPress={onPress}>
      {({ pressed }) => (
        <View
          style={[
            {
              padding: 8,
              flex: 1,
              borderRadius: 24,
              borderCurve: 'continuous',
              borderWidth: 0.5,
              alignItems: 'center',
              justifyContent: 'center',
              borderColor: '#ccc',
            },
            pressed && { backgroundColor: '#eee' },
          ]}>
          <Text style={{ fontWeight: '600' }}>{children}</Text>
        </View>
      )}
    </Pressable>
  );
}
