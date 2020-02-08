import {
  A,
  Article,
  B,
  Br,
  Nav,
  Caption,
  Code,
  Footer,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Header,
  Hr,
  I,
  Ul,
  Ol,
  Li,
  Main,
  P,
  S,
  Section,
  Table,
  Tbody,
  Td,
  Small,
  Th,
  Thead,
  Tr,
} from '@expo/html-elements';
import React from 'react';
import { View, ScrollView } from 'react-native';

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
      <ScrollView style={{ flex: 1 }}>
        <H1>Header 1</H1>
        <H2>Header 2</H2>
        <H3>Header 3</H3>
        <H4>Header 4</H4>
        <H5>Header 5</H5>
        <H6>Header 6</H6>
        <Nav>
          <P>P in Nav</P>
        </Nav>
        <Header>
          <P>P in Header</P>
        </Header>
        <Section>
          <B>Bold in Section</B>
          <Hr />
          <Ol>
            <Li>Grow a long, majestic beard.</Li>
            <Li>Wear a tall, pointed hat.</Li>
            <Ul>
              <Li>Grow a long, majestic beard.</Li>
              <Li>Wear a tall, pointed hat.</Li>
              <Li>Have I mentioned the beard?</Li>
            </Ul>
            <Li>Have I mentioned the beard?</Li>
          </Ol>
          <Ul>
            <Li>Grow a long, majestic beard.</Li>
            <Li>Wear a tall, pointed hat.</Li>
            <Ol>
              <Li>Grow a long, majestic beard.</Li>
              <Li>Wear a tall, pointed hat.</Li>
              <Li>Have I mentioned the beard?</Li>
            </Ol>
            <Li>Have I mentioned the beard?</Li>
          </Ul>
        </Section>
        <Main>
          <I>Italic in Main</I>
          <Small>Small in main</Small>
        </Main>
        <Article>
          <TableComponent />
          <A href="https://expo.io/" target="_blank">
            Anchor in Article
          </A>
        </Article>
        <Br />
        <Code>const value = true</Code>
        <Footer>
          <S>Strike in Footer</S>
        </Footer>
      </ScrollView>
    );
  }
}
