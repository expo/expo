import { useLocalSearchParams } from 'expo-router';
import { Suspense, use, useEffect, useState } from 'react';

// Streaming SSR store page: two Suspense boundaries the server completes after `?delay=<ms>` and
// `delay + 1500`. The client promises never resolve, so streamed content can only come from the server.

const PRODUCT = { title: 'Aeropress Go Travel Press', price: '$39.95', stock: 12 };
const REVIEWS = [
  { id: 'r1', author: 'Dana K.', body: 'Packs smaller than my mug.' },
  { id: 'r2', author: 'Marco P.', body: 'Great on flights. Stiff plunger.' },
  { id: 'r3', author: 'Yuki T.', body: 'Three years of daily use.' },
];
const RELATED = [
  { id: 'p1', title: 'Burr Hand Grinder', price: '$59.00' },
  { id: 'p2', title: 'Metal Filter Disc', price: '$14.50' },
];

function resolveOnServerAfter<T>(value: T, delayMs: number): Promise<T> {
  if (typeof window === 'undefined') {
    return new Promise((resolve) => setTimeout(() => resolve(value), delayMs));
  }
  return new Promise(() => {});
}

export default function StreamingStorePage() {
  const { delay } = useLocalSearchParams<{ delay?: string }>();
  const reviewsDelay = Number(delay) || 1000;
  // Created in the parent, which never suspends, so each promise is made once per request.
  const [reviews] = useState(() => resolveOnServerAfter(REVIEWS, reviewsDelay));
  const [related] = useState(() => resolveOnServerAfter(RELATED, reviewsDelay + 1500));

  return (
    <main data-testid="streaming-page">
      <header>
        <h1 data-testid="streaming-header">{PRODUCT.title}</h1>
        <p>{PRODUCT.price}</p>
        <p>{PRODUCT.stock} in stock</p>
        {/* Not next to a boundary: a pending update beside one hides the failure this page tests. */}
        <HydrationMarker />
      </header>

      <section>
        <h2>Reviews</h2>
        <Suspense fallback={<ReviewsSkeleton />}>
          <Reviews promise={reviews} />
        </Suspense>
      </section>

      <section>
        <h2>Related products</h2>
        <Suspense fallback={<RelatedSkeleton />}>
          <Related promise={related} />
        </Suspense>
      </section>
    </main>
  );
}

function HydrationMarker() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated ? <span data-testid="streaming-hydrated">Hydrated</span> : null;
}

function Reviews({ promise }: { promise: Promise<typeof REVIEWS> }) {
  const reviews = use(promise);
  return (
    <ul data-testid="streaming-reviews">
      {reviews.map((review) => (
        <li key={review.id}>
          <strong>{review.author}</strong> {review.body}
        </li>
      ))}
    </ul>
  );
}

function Related({ promise }: { promise: Promise<typeof RELATED> }) {
  const related = use(promise);
  return (
    <ul data-testid="streaming-related">
      {related.map((item) => (
        <li key={item.id}>
          {item.title} {item.price}
        </li>
      ))}
    </ul>
  );
}

function ReviewsSkeleton() {
  return (
    <ul data-testid="streaming-reviews-skeleton">
      {REVIEWS.map((review) => (
        <li key={review.id}>…</li>
      ))}
    </ul>
  );
}

function RelatedSkeleton() {
  return (
    <ul data-testid="streaming-related-skeleton">
      {RELATED.map((item) => (
        <li key={item.id}>…</li>
      ))}
    </ul>
  );
}
