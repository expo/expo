'use dom';

import { Image } from 'react-native';

import Font from './assets/font.ttf';

import './global.css';

console.log('Add reference to the Font:', Font);

export default function DomView() {
  return (
    <div>
      <div>Hello DOM!</div>
      <Image source={require('./assets/icon.png')} />
    </div>
  );
}
