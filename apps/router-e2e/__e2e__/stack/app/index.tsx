import { Color, Link, usePathname, type Href } from 'expo-router';
import { Toolbar } from 'expo-router/unstable-toolbar';
import { SymbolView } from 'expo-symbols';
import React, { use, useRef, useState } from 'react';
import {
  Text,
  Pressable,
  ScrollView,
  View,
  Switch,
  TextInput,
  useWindowDimensions,
} from 'react-native';

import { IsProtectedContext } from '../utils/contexts';

const HomeIndex = () => {
  const [isProtected, setIsProtected] = use(IsProtectedContext);
  const [shouldUseCustomXButton, setShouldUseCustomXButton] = useState(false);
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const textInputRef = useRef<TextInput>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#fff' }}
        contentContainerStyle={{ alignItems: 'center', gap: 16 }}
        contentInsetAdjustmentBehavior="automatic">
        <View>
          <Text>Home - Index</Text>
          <Text>Current Path: {pathname}</Text>
        </View>
        <CaseLink href="/modal" text="Modal" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text>Is protected?</Text>
          <Switch value={isProtected} onValueChange={setIsProtected} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text>Use custom X button (JS Pressable)?</Text>
          <Switch value={shouldUseCustomXButton} onValueChange={setShouldUseCustomXButton} />
        </View>
        <CaseLink href="/protected" text="Protected" />
        <CaseLink href="/1234" text="1234" />
        {Array.from({ length: 20 }).map((_, i) => (
          <CaseLink key={i} href={`/${i}`} text={`Go to ${i}`} />
        ))}
      </ScrollView>
      <Toolbar>
        <Toolbar.Spacer />
        <Toolbar.Button sf="magnifyingglass" tintColor={Color.ios.placeholderText} />
        <Toolbar.CustomView style={{ width: width - 250 }}>
          <TextInput
            ref={textInputRef}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholderTextColor={Color.ios.placeholderText}
            placeholder="Search"
          />
        </Toolbar.CustomView>
        <Toolbar.Button sf="mic" tintColor={Color.ios.placeholderText} />
        {shouldUseCustomXButton ? (
          <Toolbar.CustomView sharesBackground={false} style={{ width: 32, height: 32 }}>
            <Pressable
              onPress={() => {
                textInputRef.current?.clear();
                textInputRef.current?.blur();
              }}
              style={{
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <SymbolView
                size={22}
                tintColor={Color.ios.label}
                style={{
                  width: 22,
                  height: 22,
                  transform: [{ rotate: isSearchFocused ? '45deg' : '0deg' }],
                }}
                name="plus"
              />
            </Pressable>
          </Toolbar.CustomView>
        ) : (
          <>
            <Toolbar.Button hidden={isSearchFocused} sharesBackground={false} sf="plus" />
            <Toolbar.Button
              hidden={!isSearchFocused}
              sharesBackground={false}
              sf="xmark"
              onPress={() => {
                textInputRef.current?.clear();
                textInputRef.current?.blur();
              }}
            />
          </>
        )}
        <Toolbar.Spacer />
      </Toolbar>
    </>
  );
};

function CaseLink({ href, text }: { href: Href; text: string }) {
  return (
    <Link href={href} asChild>
      <Pressable style={{ backgroundColor: 'rgb(11, 103, 175)', padding: 16, borderRadius: 8 }}>
        <Text style={{ color: '#fff' }}>{text}</Text>
      </Pressable>
    </Link>
  );
}

export default HomeIndex;
