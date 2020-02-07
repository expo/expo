import {
  A,
  Article,
  B,
  Footer,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Header,
  I,
  Main,
  P,
  S,
  Section,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Caption,
} from '@expo/html-elements';
import React from 'react';
import { View } from 'react-native';

function TableComponent() {
  return (
    <Table>
      <Caption>Caption</Caption>
      <Thead>
        <Tr>
          <Th colSpan={2}>The table header</Th>
        </Tr>
      </Thead>
      <Tbody>
        <Tr>
          <Td>The table body</Td>
          <Td>with two columns</Td>
        </Tr>
      </Tbody>
    </Table>
  );
}

export default class HTMLScreen extends React.Component {
  static navigationOptions = {
    title: 'HTML',
  };

  render() {
    return (
      <View style={{ flex: 1 }}>
        <H1>Header 1</H1>
        <H2>Header 2</H2>
        <H3>Header 3</H3>
        <H4>Header 4</H4>
        <H5>Header 5</H5>
        <H6>Header 6</H6>
        <Header>
          <P>P in Header</P>
        </Header>
        <Section>
          <B>Bold in Section</B>
        </Section>
        <Main>
          <I>Italic in Main</I>
        </Main>
        <Article>
          <TableComponent />
          <A href="https://expo.io/" target="_blank">
            Anchor in Article
          </A>
        </Article>
        <Footer>
          <S>Strike in Footer</S>
        </Footer>
      </View>
    );
  }
}
