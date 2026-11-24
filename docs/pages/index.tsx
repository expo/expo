import { useEffect } from 'react';

import { getLinkText } from '~/common/click-tracking';
import DocumentationPage from '~/components/DocumentationPage';
import { reportHomeClick, reportSectionView } from '~/providers/Analytics';
import {
  BuildWithAI,
  Ecosystem,
  Hero,
  JoinTheCommunity,
  SetupExpo,
  Talks,
  Tutorials,
} from '~/ui/components/Home/sections';

function getSection(control: HTMLElement) {
  return (
    control.closest<HTMLElement>('[data-home-section]')?.dataset.homeSection ??
    control.closest('header, main, footer')?.localName ??
    'sidebar'
  );
}

function trackHomeClick(event: MouseEvent) {
  const control = (event.target as Element).closest<HTMLElement>('a[href], button');
  if (!control) {
    return;
  }
  const params = { section: getSection(control), link_text: getLinkText(control) };
  reportHomeClick(
    control instanceof HTMLAnchorElement ? { ...params, link_url: control.href } : params
  );
}

function trackSectionViews(entries: IntersectionObserverEntry[], observer: IntersectionObserver) {
  for (const entry of entries) {
    const section = (entry.target as HTMLElement).dataset.homeSection;
    if (entry.isIntersecting && section) {
      reportSectionView(section);
      observer.unobserve(entry.target);
    }
  }
}

function Home() {
  useEffect(function didMount() {
    const appRoot = document.getElementById('__next');
    appRoot?.addEventListener('click', trackHomeClick);
    return function didUnmount() {
      appRoot?.removeEventListener('click', trackHomeClick);
    };
  }, []);

  useEffect(function didMount() {
    const observer = new IntersectionObserver(trackSectionViews, { rootMargin: '-25% 0px' });
    for (const section of document.querySelectorAll('[data-home-section]')) {
      observer.observe(section);
    }
    return function didUnmount() {
      observer.disconnect();
    };
  }, []);

  return (
    <DocumentationPage
      hideTOC
      hideFromSearch
      description="Build one JavaScript/TypeScript project that runs natively on all your users' devices.">
      <section data-home-section="hero">
        <Hero />
      </section>
      <section data-home-section="build-with-ai">
        <BuildWithAI />
      </section>
      <section data-home-section="setup-expo">
        <SetupExpo />
      </section>
      <section data-home-section="ecosystem">
        <Ecosystem />
      </section>
      <section data-home-section="tutorials">
        <Tutorials />
      </section>
      <section data-home-section="talks">
        <Talks />
      </section>
      <section data-home-section="join-the-community">
        <JoinTheCommunity />
      </section>
    </DocumentationPage>
  );
}

export default Home;
