import {
  A,
  Article,
  Aside,
  B,
  BR,
  Caption,
  Code,
  Del,
  EM,
  Footer,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Header,
  I,
  LI,
  Main,
  Mark,
  Nav,
  P,
  Pre,
  S,
  Section,
  Strong,
  Table,
  TBody,
  TD,
  TFoot,
  TH,
  THead,
  Time,
  TR,
  UL,
} from '@expo/html-elements';
import View from '@expo/html-elements/build/primitives/View';
import { ScrollView } from 'react-native';

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
      <A href="https://expo.dev/" target="_blank">
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
      <UL>
        <LI>Grow a long, majestic beard.</LI>
        <LI>Wear a tall, pointed hat.</LI>
        <LI>
          <LI>Grow a long, majestic beard.</LI>
          <LI>Wear a tall, pointed hat.</LI>
          <LI>Have I mentioned the beard?</LI>
        </LI>
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

export default function HTMLScreen() {
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

HTMLScreen.navigationOptions = {
  title: 'HTML',
};
