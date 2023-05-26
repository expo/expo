const { RuleTester } = require('eslint');
const rule = require('../no-empty-styles');

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
});

ruleTester.run('no-empty-styles', rule, {
  valid: [
    {
      code: `
function App() {
  return <div style="auto" />
}`,
    },
    {
      code: `
import { Image } from 'react-native';

function App() {
  return <Image style={{ color: 'red' }} {...{}} />
}`,
    },
    {
      code: `
import { Image } from 'react-native';

function App() {
  return <Image style={{ color: 'red' }} />
}`,
    },
    {
      code: `
import { Image } from 'react-native';

function App() {
  return <Image style={[{ color: 'red' }, { background: 'blue' }]} />
}`,
    },
  ],
  invalid: [
    {
      code: `
import { Image } from 'react-native';

function App() {
  return <Image style={[]} />
}`,
      output: `
import { Image } from 'react-native';

function App() {
  return <Image />
}`,
      errors: [{ message: 'Remove empty style arrays' }],
    },
    {
      code: `
import { Image } from 'react-native';

function App() {
  return <Image style={{}} />
}`,
      output: `
import { Image } from 'react-native';

function App() {
  return <Image />
}`,
      errors: [{ message: 'Remove empty style objects' }],
    },
    {
      code: `
import { Image } from 'react-native';

function App() {
  return <Image style={[{ color: 'red' }]} />
}`,
      output: `
import { Image } from 'react-native';

function App() {
  return <Image style={{ color: 'red' }} />
}`,
      errors: [{ message: 'Replace single-object style arrays with the object' }],
    },
    {
      code: `
import { Image } from 'react-native';

function App() {
  const style = { color: 'red' };
  return <Image style={[style]} />
}`,
      output: `
import { Image } from 'react-native';

function App() {
  const style = { color: 'red' };
  return <Image style={style} />
}`,
      errors: [{ message: 'Replace single-identifier style arrays with the identifier' }],
    },
    {
      code: `
const styles = { container: {color: 'red'} };
function App() {
  return <div style={[styles.container]} />
}`,
      output: `
const styles = { container: {color: 'red'} };
function App() {
  return <div style={styles.container} />
}`,
      errors: [{ message: 'Replace `style={[styles.container]}` with `style={styles.container}`' }],
    },
  ],
});
