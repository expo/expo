import { Text, TextProps, View, ViewProps } from 'react-native';
import { useCssElement } from 'expo/css';

import styles from '../styles.module.css';
import '../globals.css';

function Span(props: TextProps & { className?: string }) {
  return useCssElement(Text, props, {
    className: 'style',
  });
}

function Div(props: ViewProps & { className?: string }) {
  return useCssElement(View, props, {
    className: 'style',
  });
}

export default function Page() {
  return (
    <Div className="container">
      <Div className={styles.card}>
        <Span testID="index-text" className="text">
          Index
        </Span>
      </Div>
    </Div>
  );
}
