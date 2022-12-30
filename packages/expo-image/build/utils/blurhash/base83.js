const digitCharacters = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
    'i',
    'j',
    'k',
    'l',
    'm',
    'n',
    'o',
    'p',
    'q',
    'r',
    's',
    't',
    'u',
    'v',
    'w',
    'x',
    'y',
    'z',
    '#',
    '$',
    '%',
    '*',
    '+',
    ',',
    '-',
    '.',
    ':',
    ';',
    '=',
    '?',
    '@',
    '[',
    ']',
    '^',
    '_',
    '{',
    '|',
    '}',
    '~',
];
export const decode83 = (str) => {
    let value = 0;
    for (let i = 0; i < str.length; i++) {
        const c = str[i];
        const digit = digitCharacters.indexOf(c);
        value = value * 83 + digit;
    }
    return value;
};
export const encode83 = (n, length) => {
    let result = '';
    for (let i = 1; i <= length; i++) {
        const digit = (Math.floor(n) / Math.pow(83, length - i)) % 83;
        result += digitCharacters[Math.floor(digit)];
    }
    return result;
};
//# sourceMappingURL=base83.js.map