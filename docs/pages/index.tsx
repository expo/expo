import { useEffect } from 'react';

import DocumentationPage from '~/components/DocumentationPage';
import { reportHomeClick, reportSectionView } from '~/providers/Analytics';
import { AppJSBanner } from '~/ui/components/AppJSBanner';
import { DevicesImageMasks } from '~/ui/components/Home/resources';
import {
  QuickStart,
  CommandLineTools,
  DiscoverMore,
  ExploreAPIs,
  Talks,
  JoinTheCommunity,
} from '~/ui/components/Home/sections';
import { ExploreExamples } from '~/ui/components/Home/sections/ExploreExamples';

function getSection(control: HTMLElement) {
  return (
    control.closest<HTMLElement>('[data-home-section]')?.dataset.homeSection ??
    control.closest('header, main, footer')?.localName ??
    'sidebar'
  );
}

function getLinkText(control: HTMLElement) {
  const terminalCommands = control.closest<HTMLElement>('[data-md="terminal"]')?.dataset.mdCommands;
  if (terminalCommands) {
    return Object.values(JSON.parse(terminalCommands)).flat().join(' ');
  }
  return control.getAttribute('aria-label') ?? control.innerText.trim().split('\n')[0];
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
      <div className="h-0">
        <DevicesImageMasks />
      </div>
      <AppJSBanner />
      <section data-home-section="quick-start">
        <QuickStart />
      </section>
      <section data-home-section="command-line-tools">
        <CommandLineTools />
      </section>
      <section data-home-section="discover-more">
        <DiscoverMore />
      </section>
      <section data-home-section="explore-apis">
        <ExploreAPIs />
      </section>
      <section data-home-section="explore-examples">
        <ExploreExamples />
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
