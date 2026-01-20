import { Color, Link, usePathname, Stack, type Href } from 'expo-router';
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
        <CaseLink
          href={{ pathname: '/test', params: { __internal_expo_router_no_animation: 1 } }}
          text="/test with animation disabled"
        />
        <CaseLink href="/apple-files" text="Apple Files" />
        <CaseLink href="/test" text="test" />
        <CaseLink href="/timer" text="Timer with preload" prefetch />
        {Array.from({ length: 20 }).map((_, i) => (
          <CaseLink key={i} href={`/${i}`} text={`Go to ${i}`} />
        ))}
      </ScrollView>
      <Stack.Toolbar>
        <Stack.Toolbar.Spacer />
        <Stack.Toolbar.Button icon="sf:magnifyingglass" tintColor={Color.ios.placeholderText} />
        <Stack.Toolbar.View>
          <TextInput
            style={{ width: width - 250, height: 32 }}
            ref={textInputRef}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholderTextColor={Color.ios.placeholderText}
            placeholder="Search"
          />
        </Stack.Toolbar.View>
        <Stack.Toolbar.Button icon="sf:mic" tintColor={Color.ios.placeholderText} />
        {shouldUseCustomXButton ? (
          <Stack.Toolbar.View hidesSharedBackground>
            <Pressable
              onPress={() => {
                textInputRef.current?.clear();
                textInputRef.current?.blur();
              }}
              style={{
                width: 32,
                height: 32,
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
          </Stack.Toolbar.View>
        ) : (
          <>
            <Stack.Toolbar.Button hidden={isSearchFocused} hidesSharedBackground icon="sf:plus" />
            <Stack.Toolbar.Button
              hidden={!isSearchFocused}
              hidesSharedBackground
              icon="sf:xmark"
              onPress={() => {
                textInputRef.current?.clear();
                textInputRef.current?.blur();
              }}
            />
          </>
        )}
        <Stack.Toolbar.Spacer />
      </Stack.Toolbar>
    </>
  );
};

function CaseLink({ href, text, prefetch }: { href: Href; text: string; prefetch?: boolean }) {
  return (
    <Link href={href} asChild prefetch={prefetch}>
      <Pressable style={{ backgroundColor: 'rgb(11, 103, 175)', padding: 16, borderRadius: 8 }}>
        <Text style={{ color: '#fff' }}>{text}</Text>
      </Pressable>
    </Link>
  );
}

export default HomeIndex;
