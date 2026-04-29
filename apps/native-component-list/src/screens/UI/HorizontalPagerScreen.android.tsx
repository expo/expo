import {
  HorizontalPager,
  Box,
  Button,
  Host,
  Card,
  Column,
  LazyColumn,
  Row,
  TextField,
  Text as ComposeText,
  usePagerNativeState,
} from '@expo/ui/jetpack-compose';
import {
  background,
  fillMaxSize,
  fillMaxWidth,
  height,
  padding,
} from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';
import { useState, useRef } from 'react';

const PAGE_COUNT = 5;
const PAGE_COLORS = ['#6200EE', '#03DAC5', '#FF5722', '#4CAF50', '#2196F3', '#E91E63', '#9C27B0'];

function ColorPage({ index }: { index: number }) {
  const color = PAGE_COLORS[index % PAGE_COLORS.length];
  return (
    <Box modifiers={[fillMaxSize(), background(color)]} contentAlignment="center">
      <ComposeText color="#FFFFFF" style={{ typography: 'headlineLarge' }}>
        Page {index + 1}
      </ComposeText>
    </Box>
  );
}

// Per-page TextField is uncontrolled (no value prop) so the typed text lives in
// the native Compose TextField — not in React state. This makes the section a
// regression test: if prepending a page shifts typed text to the wrong page, the
// keying is broken.
//
// `index` is the note's stable identity (also doubles as the React key and the
// label). Prepending a new note doesn't shift existing notes' indices — instead
// the new note gets a negative index. That way each note keeps its color and
// label across inserts/removes.
function NotePage({ index }: { index: number }) {
  const color = PAGE_COLORS[Math.abs(index) % PAGE_COLORS.length];
  return (
    <Column
      verticalArrangement="center"
      horizontalAlignment="center"
      modifiers={[fillMaxSize(), background(color), padding(24, 24, 24, 24)]}>
      <ComposeText color="#FFFFFF" style={{ typography: 'headlineLarge' }}>
        Note {index}
      </ComposeText>
      <TextField singleLine modifiers={[fillMaxWidth()]}>
        <TextField.Placeholder>
          <ComposeText>{`Type into note ${index}\u2026`}</ComposeText>
        </TextField.Placeholder>
      </TextField>
    </Column>
  );
}

function DynamicPagesSection() {
  const nextPrependedIndex = useRef(0);
  const [notes, setNotes] = useState<{ index: number }[]>([
    { index: 1 },
    { index: 2 },
    { index: 3 },
  ]);
  const pagerState = usePagerNativeState();
  const [currentPage, setCurrentPage] = useState(0);

  return (
    <Card modifiers={[fillMaxWidth()]}>
      <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
        <ComposeText style={{ typography: 'titleMedium' }}>
          Dynamic pages (state stays with content)
        </ComposeText>
        <ComposeText style={{ typography: 'bodySmall' }} color="#666666">
          Each page hosts an uncontrolled TextField. Type something into note 2, then tap "Insert at
          beginning". The text should travel with note 2, not stay at the same position. Note: a
          brief visual glitch on prepend is expected — index-based pagers can't atomically shift
          children and scroll in the same frame (unlike iOS TabView's value-based selection).
        </ComposeText>
        <ComposeText style={{ typography: 'bodySmall' }} color="#666666">
          Notes: {notes.map((n) => n.index).join(', ')} — viewing index {currentPage}
        </ComposeText>
        <HorizontalPager
          state={pagerState}
          onPageSelected={setCurrentPage}
          modifiers={[fillMaxWidth(), height(250)]}>
          {notes.map((note) => (
            <NotePage key={note.index} index={note.index} />
          ))}
        </HorizontalPager>
        <Button
          onClick={() => {
            const index = nextPrependedIndex.current--;
            setNotes((prev) => [{ index }, ...prev]);
            const next = currentPage + 1;
            setCurrentPage(next);
            pagerState.scrollToPage(next);
          }}>
          <ComposeText>Insert at beginning</ComposeText>
        </Button>
        <Button
          onClick={() => {
            if (notes.length <= 1) return;
            const removedIndex = 0;
            setNotes((prev) => prev.slice(1));
            const next = currentPage === removedIndex ? 0 : Math.max(0, currentPage - 1);
            setCurrentPage(next);
            pagerState.scrollToPage(next);
          }}>
          <ComposeText>Remove first</ComposeText>
        </Button>
      </Column>
    </Card>
  );
}

function UncontrolledSection() {
  const pagerState = usePagerNativeState({ initialPage: 1 });
  const [lastReported, setLastReported] = useState(1);

  return (
    <Card modifiers={[fillMaxWidth()]}>
      <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
        <ComposeText style={{ typography: 'titleMedium' }}>Uncontrolled</ComposeText>
        <ComposeText style={{ typography: 'bodySmall' }} color="#666666">
          Native owns the state via the pager state object. Starts at the second page via
          initialPage. Last reported page: {lastReported}
        </ComposeText>
        <HorizontalPager
          state={pagerState}
          onPageSelected={setLastReported}
          modifiers={[fillMaxWidth(), height(200)]}>
          <ColorPage index={0} />
          <ColorPage index={1} />
          <ColorPage index={2} />
        </HorizontalPager>
      </Column>
    </Card>
  );
}

export default function HorizontalPagerScreen() {
  const pagerState = usePagerNativeState();
  const [page, setPage] = useState(0);

  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <UncontrolledSection />

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText style={{ typography: 'titleMedium' }}>Programmatic navigation</ComposeText>
            <ComposeText style={{ typography: 'bodySmall' }} color="#666666">
              Page {page + 1} / {PAGE_COUNT}
            </ComposeText>
            <HorizontalPager
              state={pagerState}
              onPageSelected={setPage}
              modifiers={[fillMaxWidth(), height(200)]}>
              {Array.from({ length: PAGE_COUNT }).map((_, i) => (
                <ColorPage key={i} index={i} />
              ))}
            </HorizontalPager>
            <Row horizontalArrangement={{ spacedBy: 8 }}>
              <Button onClick={() => pagerState.animateScrollToPage(0)}>
                <ComposeText>First</ComposeText>
              </Button>
              <Button onClick={() => pagerState.animateScrollToPage(Math.max(0, page - 1))}>
                <ComposeText>Prev</ComposeText>
              </Button>
              <Button onClick={() => pagerState.animateScrollToPage(Math.min(PAGE_COUNT - 1, page + 1))}>
                <ComposeText>Next</ComposeText>
              </Button>
              <Button onClick={() => pagerState.animateScrollToPage(PAGE_COUNT - 1)}>
                <ComposeText>Last</ComposeText>
              </Button>
            </Row>
            <Row horizontalArrangement={{ spacedBy: 8 }}>
              <Button onClick={() => pagerState.animateScrollToPage(-1)}>
                <ComposeText>-1</ComposeText>
              </Button>
              <Button onClick={() => pagerState.animateScrollToPage(PAGE_COUNT)}>
                <ComposeText>{PAGE_COUNT}</ComposeText>
              </Button>
              <Button onClick={() => pagerState.scrollToPage(0)}>
                <ComposeText>Jump to 1 (no anim)</ComposeText>
              </Button>
            </Row>
          </Column>
        </Card>

        <DynamicPagesSection />

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText style={{ typography: 'titleMedium' }}>Page spacing</ComposeText>
            <ComposeText style={{ typography: 'bodySmall' }} color="#666666">
              16 dp gap between pages, visible during swipe.
            </ComposeText>
            <HorizontalPager pageSpacing={16} modifiers={[fillMaxWidth(), height(150)]}>
              <ColorPage index={0} />
              <ColorPage index={1} />
              <ColorPage index={2} />
            </HorizontalPager>
          </Column>
        </Card>

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText style={{ typography: 'titleMedium' }}>Content padding</ComposeText>
            <ComposeText style={{ typography: 'bodySmall' }} color="#666666">
              Horizontal padding reveals neighboring pages at rest.
            </ComposeText>
            <HorizontalPager
              contentPadding={{ start: 32, end: 32 }}
              pageSpacing={12}
              modifiers={[fillMaxWidth(), height(150)]}>
              <ColorPage index={3} />
              <ColorPage index={4} />
              <ColorPage index={0} />
            </HorizontalPager>
          </Column>
        </Card>

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText style={{ typography: 'titleMedium' }}>Reverse layout</ComposeText>
            <ComposeText style={{ typography: 'bodySmall' }} color="#666666">
              Pages are laid out right-to-left.
            </ComposeText>
            <HorizontalPager reverseLayout modifiers={[fillMaxWidth(), height(150)]}>
              <ColorPage index={0} />
              <ColorPage index={1} />
              <ColorPage index={2} />
            </HorizontalPager>
          </Column>
        </Card>

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText style={{ typography: 'titleMedium' }}>Scroll disabled</ComposeText>
            <ComposeText style={{ typography: 'bodySmall' }} color="#666666">
              Swipe is disabled — only programmatic navigation works.
            </ComposeText>
            <HorizontalPager userScrollEnabled={false} modifiers={[fillMaxWidth(), height(150)]}>
              <ColorPage index={2} />
              <ColorPage index={3} />
              <ColorPage index={4} />
            </HorizontalPager>
          </Column>
        </Card>
      </LazyColumn>
    </Host>
  );
}

HorizontalPagerScreen.navigationOptions = {
  title: 'HorizontalPager',
};
