import { Link, usePathname } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Text, ScrollView } from 'react-native';

import { useTimer } from '../utils/useTimer';

const Menus = () => {
  const pathname = usePathname();
  const time = useTimer();

  const [palette, setPalette] = useState<string>('1');
  const [submenu, setSubmenu] = useState<string>('1');

  const timeOptions = useMemo(
    () =>
      // Add new option every 5 seconds
      Array.from({ length: Math.floor(time / 5) + 2 }, (_, i) => ({
        label: `Option ${i + 1}`,
        value: i + 1,
      })),
    [time]
  );

  useEffect(() => {
    console.log('Palette:', palette);
  }, [palette]);

  useEffect(() => {
    console.log('Submenu:', submenu);
  }, [submenu]);

  return (
    <ScrollView style={{ backgroundColor: '#fff' }} contentInsetAdjustmentBehavior="automatic">
      <Text>Misc</Text>
      <Text>Current Path: {pathname}</Text>
      <Text style={{ marginBottom: 16 }}>Time: {time}</Text>
      <Link href="/one">
        <Link.Trigger>Link.Menu: /one</Link.Trigger>
        <Link.Preview />
        <Link.Menu title="Actions" icon="ellipsis">
          <Link.MenuAction
            title="Share"
            icon="square.and.arrow.up"
            onPress={() => {
              console.log('Share Pressed');
            }}
          />
          <Link.MenuAction
            title="Copy"
            icon="doc.on.doc"
            onPress={() => {
              console.log('Copy Pressed');
            }}
          />
          <Link.MenuAction
            title="Delete"
            icon="trash"
            onPress={() => {
              console.log('Delete Pressed');
            }}
          />
          <Link.Menu title="More" icon="ellipsis">
            <Link.MenuAction
              title="Submenu Item 1"
              onPress={() => {
                console.log('Submenu Item 1 Pressed');
              }}
            />
            <Link.MenuAction
              title="Submenu Item 2"
              onPress={() => {
                console.log('Submenu Item 2 Pressed');
              }}
            />
          </Link.Menu>
        </Link.Menu>
      </Link>
      <Link href="/one">
        <Link.Trigger>Link.Menu with dynamic options: /one</Link.Trigger>
        <Link.Preview />
        <Link.Menu title="Actions" icon="ellipsis">
          <Link.MenuAction
            title="Share"
            icon="square.and.arrow.up"
            onPress={() => {
              console.log('Share Pressed');
            }}
          />
          <Link.Menu title="More" icon="ellipsis">
            {timeOptions.map((option) => (
              <Link.MenuAction
                key={option.value}
                title={option.label}
                onPress={() => {
                  console.log(`Option ${option.value} Pressed`);
                }}
              />
            ))}
          </Link.Menu>
        </Link.Menu>
      </Link>
      <Link href="/one">
        <Link.Trigger>Link.Menu no preview: /one</Link.Trigger>
        <Link.Menu title="Actions" icon="ellipsis">
          <Link.MenuAction
            title="Share"
            icon="square.and.arrow.up"
            onPress={() => {
              console.log('Share Pressed');
            }}
          />
          <Link.MenuAction
            title="Copy"
            icon="doc.on.doc"
            disabled
            onPress={() => {
              console.log('Copy Pressed');
            }}
          />
          <Link.MenuAction
            title="Delete"
            icon="trash"
            destructive
            onPress={() => {
              console.log('Delete Pressed');
            }}
          />
          <Link.Menu title="Single" displayAsPalette displayInline>
            <Link.MenuAction
              title="1"
              onPress={() => setPalette('1')}
              isOn={palette === '1'}
              unstable_keepPresented
            />
            <Link.MenuAction
              title="2"
              onPress={() => setPalette('2')}
              isOn={palette === '2'}
              unstable_keepPresented
            />
            <Link.MenuAction
              title="3"
              onPress={() => setPalette('3')}
              isOn={palette === '3'}
              unstable_keepPresented
            />
            <Link.MenuAction
              title="4"
              onPress={() => setPalette('4')}
              isOn={palette === '4'}
              unstable_keepPresented
            />
            <Link.MenuAction
              title="5"
              onPress={() => setPalette('5')}
              isOn={palette === '5'}
              unstable_keepPresented
            />
            <Link.MenuAction
              title="6"
              onPress={() => setPalette('6')}
              isOn={palette === '6'}
              unstable_keepPresented
            />
          </Link.Menu>
          <Link.Menu title="More" icon="ellipsis">
            <Link.MenuAction
              title="Submenu Item 1"
              isOn={submenu === '1'}
              onPress={() => {
                setSubmenu('1');
              }}
            />
            <Link.MenuAction
              title="Submenu Item 2"
              isOn={submenu === '2'}
              onPress={() => {
                setSubmenu('2');
              }}
            />
          </Link.Menu>
        </Link.Menu>
      </Link>
      <Link href="https://expo.dev">
        <Link.Trigger>Link.Menu no preview: https://expo.dev</Link.Trigger>
        <Link.Menu title="Actions" icon="ellipsis">
          <Link.MenuAction
            title="Share"
            icon="square.and.arrow.up"
            onPress={() => {
              console.log('Share Pressed');
            }}
          />
          <Link.MenuAction
            title="Copy"
            icon="doc.on.doc"
            disabled
            onPress={() => {
              console.log('Copy Pressed');
            }}
          />
          <Link.MenuAction
            title="Delete"
            icon="trash"
            destructive
            onPress={() => {
              console.log('Delete Pressed');
            }}
          />
        </Link.Menu>
      </Link>
    </ScrollView>
  );
};

export default Menus;
