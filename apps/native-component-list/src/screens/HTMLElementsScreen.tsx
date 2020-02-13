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
  Mark,
  Del,
  EM,
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
  Strong,
  Aside,
  TFoot,
} from '@expo/html-elements';
import React from 'react';
import { ScrollView } from 'react-native';
import View from '@expo/html-elements/build/primitives/View';

function CustomArticle({ title, children }: any) {
  return (
    <Article style={{ marginVertical: 8, backgroundColor: 'white' }}>
      <Header style={{ padding: 8, backgroundColor: '#e6e6e6' }}>
        <B>{title}</B>
      </Header>
      <Section style={{ padding: 8 }}>{children}</Section>
    </Article>
  );
}

function HeadingArticle() {
  return (
    <CustomArticle title="Headings">
      <H1>Header 1</H1>
      <H2>Header 2</H2>
      <H3>Header 3</H3>
      <H4>Header 4</H4>
      <H5>Header 5</H5>
      <H6>Header 6</H6>
    </CustomArticle>
  );
}

function LayoutArticle() {
  return (
    <CustomArticle title="Layout">
      <Nav style={{ padding: 8, borderWidth: 1 }}>
        <P>Nav</P>
      </Nav>

      <Main style={{ padding: 8, borderWidth: 1 }}>
        <P>Main</P>
        <Article style={{ padding: 8, borderWidth: 1 }}>
          <P>Article</P>
          <View style={{ flexDirection: 'row', flex: 1 }}>
            <Section style={{ padding: 8, flex: 2, borderWidth: 1 }}>
              <P>Section</P>
            </Section>
            <Aside style={{ padding: 8, flex: 1, borderWidth: 1 }}>
              <P>Aside</P>
            </Aside>
          </View>
        </Article>
      </Main>
      <Footer style={{ padding: 8, borderWidth: 1 }}>
        <P>Footer</P>
      </Footer>
    </CustomArticle>
  );
}

function TextArticle() {
  return (
    <CustomArticle title="Text">
      <A href="https://expo.io/" target="_blank">
        Anchor
      </A>
      <P>Paragraph</P>
      <B>Bold</B>
      <Strong>Strong</Strong>
      <Mark>Mark</Mark>
      <Code>Code</Code>
      <Time>Feb 2020</Time>
      <I>Italic</I>
      <EM>Emphasize</EM>
      <Small>Small</Small>
      <S>Striked</S>
      <Del>Deleted</Del>
      <Pre>{preformattedText}</Pre>
      <Pre>
        <Code>{`<Code />`}</Code>
      </Pre>
      <P>
        A neat nested <Mark>sentence</Mark> with <B>TONS</B> of effects{' '}
        <Code>const value = true</Code>
      </P>
    </CustomArticle>
  );
}

function ListsArticle() {
  return (
    <CustomArticle title="Lists">
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
    </CustomArticle>
  );
}
function TablesArticle() {
  return (
    <CustomArticle title="Tables">
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
          <TR>
            <TD>Row two</TD>
            <TD>Column two</TD>
          </TR>
        </TBody>
        <TFoot>
          <TR>
            <TH colSpan={2}>The table footer</TH>
          </TR>
        </TFoot>
      </Table>
    </CustomArticle>
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
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
        <Nav style={{ padding: 8, borderBottomWidth: 1 }}>
          <B>Nav</B>
        </Nav>

        <Main>
          <LayoutArticle />
          <HeadingArticle />
          <TextArticle />
          <ListsArticle />
          <TablesArticle />
        </Main>
        <BR />
        <Footer>
          <B>Footer</B>
        </Footer>
      </ScrollView>
    );
  }
}
