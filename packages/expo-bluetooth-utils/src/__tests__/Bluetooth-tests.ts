import { encodeBinaryString, decodeBinaryString } from '../Bluetooth';

it(`decodes a binary string`, () => {
    expect(decodeBinaryString('RXhwbw==')).toBe('Expo');
});

it(`encodes a value`, () => {
    expect(encodeBinaryString('Expo')).toBe('RXhwbw==');
})
