import { css } from '@emotion/react';
import { breakpoints, theme } from '@expo/styleguide';
import some from 'lodash/some';
import Router, { NextRouter } from 'next/router';
import * as React from 'react';

import * as Utilities from '~/common/utilities';
import * as WindowUtils from '~/common/window';
import DocumentationFooter from '~/components/DocumentationFooter';
import DocumentationNestedScrollLayout from '~/components/DocumentationNestedScrollLayout';
import DocumentationSidebarRight, {
  SidebarRightComponentType,
} from '~/components/DocumentationSidebarRight';
import Head from '~/components/Head';
import { H1 } from '~/components/base/headings';
import { PageApiVersionContextType, usePageApiVersion } from '~/providers/page-api-version';
import navigation from '~/public/static/constants/navigation.json';
import { NavigationRoute } from '~/types/common';
import { Header } from '~/ui/components/Header';
import { Sidebar } from '~/ui/components/Sidebar';

const STYLES_DOCUMENT = css`
  background: ${theme.background.default};
  margin: 0 auto;
  padding: 40px 56px;

  hr {
    border: 0;
    height: 0.01rem;
    background-color: ${theme.border.default};
  }

  @media screen and (max-width: ${breakpoints.medium + 124}px) {
    padding: 20px 16px 48px 16px;
  }
`;

type Props = React.PropsWithChildren<{
  router: NextRouter;
  title?: string;
  sourceCodeUrl?: string;
  tocVisible: boolean;
  /** If the page should not show up in the Algolia Docsearch results */
  hideFromSearch?: boolean;
  version: PageApiVersionContextType['version'];
}>;

type State = {
  isMobileMenuVisible: boolean;
};

class DocumentationPageWithApiVersion extends React.Component<Props, State> {
  state = {
    isMobileMenuVisible: false,
  };

  private layoutRef = React.createRef<DocumentationNestedScrollLayout>();
  private sidebarRightRef = React.createRef<SidebarRightComponentType>();

  componentDidMount() {
    Router.events.on('routeChangeStart', url => {
      if (this.layoutRef.current) {
        if (this.getActiveTopLevelSection() !== this.getActiveTopLevelSection(url)) {
          window.__sidebarScroll = 0;
        } else {
          window.__sidebarScroll = this.layoutRef.current.getSidebarScrollTop();
        }
      }
    });
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    if (WindowUtils.getViewportSize().width >= breakpoints.medium + 124) {
      this.setState({ isMobileMenuVisible: false });
      window.scrollTo(0, 0);
    }
  };

  private pathStartsWith = (name: string, path: string = this.props.router.pathname) => {
    return path.startsWith(`/${name}`);
  };

  private isArchivePath = () => {
    return this.props.router.pathname.startsWith('/archive');
  };

  private isReferencePath = (path?: string) => {
    return this.pathStartsWith('versions', path);
  };

  private isGeneralPath = () => {
    return some(navigation.generalDirectories, name =>
      this.props.router.pathname.startsWith(`/${name}`)
    );
  };

  private isFeaturePreviewPath = (path?: string) => {
    return navigation.featurePreview.some((name: string) => this.pathStartsWith(name, path));
  };

  private isPreviewPath = () => {
    return some(navigation.previewDirectories, name =>
      this.props.router.pathname.startsWith(`/${name}`)
    );
  };

  private isEasPath = (path?: string) => {
    return navigation.easDirectories.some(name => this.pathStartsWith(name, path));
  };

  private getCanonicalUrl = () => {
    if (this.isReferencePath()) {
      return `https://docs.expo.dev${Utilities.replaceVersionInUrl(
        this.props.router.pathname,
        'latest'
      )}`;
    } else {
      return `https://docs.expo.dev${this.props.router.pathname}`;
    }
  };

  private getAlgoliaTag = () => {
    if (this.props.hideFromSearch === true) {
      return null;
    }

    return this.isReferencePath() ? this.props.version : 'none';
  };

  private getRoutes = (): NavigationRoute[] => {
    if (this.isReferencePath()) {
      return navigation.reference[this.props.version] as NavigationRoute[];
    } else {
      return navigation[this.getActiveTopLevelSection()] as NavigationRoute[];
    }
  };

  private getActiveTopLevelSection = (path?: string) => {
    if (this.isReferencePath(path)) {
      return 'reference';
    } else if (this.isEasPath(path)) {
      return 'eas';
    } else if (this.isGeneralPath()) {
      return 'general';
    } else if (this.isFeaturePreviewPath(path)) {
      return 'featurePreview';
    } else if (this.isPreviewPath()) {
      return 'preview';
    } else if (this.isArchivePath()) {
      return 'archive';
    }

    return 'general';
  };

  render() {
    const routes = this.getRoutes();
    const sidebarActiveGroup = this.getActiveTopLevelSection();
    const sidebarScrollPosition = process.browser ? window.__sidebarScroll : 0;

    const sidebarElement = <Sidebar routes={routes} />;
    const headerElement = (
      <Header
        sidebar={sidebarElement}
        sidebarActiveGroup={sidebarActiveGroup}
        isMobileMenuVisible={this.state.isMobileMenuVisible}
        setMobileMenuVisible={isMobileMenuVisible => this.setState({ isMobileMenuVisible })}
      />
    );

    const handleContentScroll = (contentScrollPosition: number) => {
      window.requestAnimationFrame(() => {
        if (this.sidebarRightRef && this.sidebarRightRef.current) {
          this.sidebarRightRef.current.handleContentScroll(contentScrollPosition);
        }
      });
    };

    const sidebarRight = <DocumentationSidebarRight ref={this.sidebarRightRef} />;

    const algoliaTag = this.getAlgoliaTag();
    const title = this.props.title
      ? `${this.props.title} - Expo Documentation`
      : `Expo Documentation`;

    const pageContent = (
      <>
        {this.props.title && <H1>{this.props.title}</H1>}
        {this.props.children}
        {this.props.title && (
          <DocumentationFooter
            router={this.props.router}
            title={this.props.title}
            sourceCodeUrl={this.props.sourceCodeUrl}
          />
        )}
      </>
    );

    return (
      <DocumentationNestedScrollLayout
        ref={this.layoutRef}
        header={headerElement}
        sidebar={sidebarElement}
        sidebarActiveGroup={sidebarActiveGroup}
        sidebarRight={sidebarRight}
        tocVisible={this.props.tocVisible}
        isMobileMenuVisible={this.state.isMobileMenuVisible}
        onContentScroll={handleContentScroll}
        sidebarScrollPosition={sidebarScrollPosition}>
        <Head title={this.props.title}>
          {algoliaTag !== null && <meta name="docsearch:version" content={algoliaTag} />}
          <meta property="og:title" content={title} />
          <meta property="og:type" content="website" />
          <meta property="og:image" content="https://docs.expo.dev/static/images/og.png" />
          <meta property="og:image:url" content="https://docs.expo.dev/static/images/og.png" />
          <meta
            property="og:image:secure_url"
            content="https://docs.expo.dev/static/images/og.png"
          />
          <meta property="og:locale" content="en_US" />
          <meta property="og:site_name" content="Expo Documentation" />
          <meta
            property="og:description"
            content="Expo is an open-source platform for making universal native apps for Android, iOS, and the web with JavaScript and React."
          />

          <meta name="twitter:site" content="@expo" />
          <meta name="twitter:card" content="summary" />
          <meta property="twitter:title" content={title} />
          <meta
            name="twitter:description"
            content="Expo is an open-source platform for making universal native apps for Android, iOS, and the web with JavaScript and React."
          />
          <meta
            property="twitter:image"
            content="https://docs.expo.dev/static/images/twitter.png"
          />

          {(this.props.version === 'unversioned' ||
            this.isPreviewPath() ||
            this.isArchivePath()) && <meta name="robots" content="noindex" />}

          {this.props.version !== 'unversioned' && (
            <link rel="canonical" href={this.getCanonicalUrl()} />
          )}
        </Head>
        <div css={STYLES_DOCUMENT}>{pageContent}</div>
      </DocumentationNestedScrollLayout>
    );
  }
}

export default function DocumentationPage(props: Omit<Props, 'version'>) {
  const { version } = usePageApiVersion();
  return <DocumentationPageWithApiVersion {...props} version={version} />;
}
