import {
  A,
  Article,
  B,
  BR,
  Caption,
  Code,
  Footer,
  H1,
  H2,
  Pre,
  H3,
  H4,
  H5,
  H6,
  Header,
  Time,
  HR,
  I,
  LI,
  Main,
  Nav,
  OL,
  P,
  S,
  Section,
  Small,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  UL,
} from '@expo/html-elements';
import React from 'react';
import { ScrollView } from 'react-native';

function TableComponent() {
  return (
    <Table>
      <Caption>Caption</Caption>
      <THead>
        <TR>
          <TH colSpan={2}>The table header</TH>
        </TR>
      </THead>
      <TBody>
        <TR>
          <TD>The table body</TD>
          <TD>with two columns</TD>
        </TR>
      </TBody>
    </Table>
  );
}

const preformattedText = `body {
  color: red;
}`;

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
        <Pre>{preformattedText}</Pre>
        <Pre>
          <Code>{`<Code />`}</Code>
        </Pre>
        <Nav>
          <P>P in Nav</P>
        </Nav>
        <Header>
          <P>P in Header</P>
        </Header>
        <Section>
          <B>Bold in Section</B>
          <Time>Feb 2020</Time>
          <HR />
          <OL>
            <LI>Grow a long, majestic beard.</LI>
            <LI>Wear a tall, pointed hat.</LI>
            <UL>
              <LI>Grow a long, majestic beard.</LI>
              <LI>Wear a tall, pointed hat.</LI>
              <LI>Have I mentioned the beard?</LI>
            </UL>
            <LI>Have I mentioned the beard?</LI>
          </OL>
          <UL>
            <LI>Grow a long, majestic beard.</LI>
            <LI>Wear a tall, pointed hat.</LI>
            <OL>
              <LI>Grow a long, majestic beard.</LI>
              <LI>Wear a tall, pointed hat.</LI>
              <LI>Have I mentioned the beard?</LI>
            </OL>
            <LI>Have I mentioned the beard?</LI>
          </UL>
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
        <BR />
        <Code>const value = true</Code>
        <Footer>
          <S>Strike in Footer</S>
        </Footer>
      </ScrollView>
    );
  }
}
