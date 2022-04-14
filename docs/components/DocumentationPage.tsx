import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import some from 'lodash/some';
import Router, { NextRouter } from 'next/router';
import * as React from 'react';

import * as Utilities from '~/common/utilities';
import * as WindowUtils from '~/common/window';
import DocumentationFooter from '~/components/DocumentationFooter';
import DocumentationHeader from '~/components/DocumentationHeader';
import DocumentationNestedScrollLayout from '~/components/DocumentationNestedScrollLayout';
import DocumentationSidebar from '~/components/DocumentationSidebar';
import DocumentationSidebarRight, {
  SidebarRightComponentType,
} from '~/components/DocumentationSidebarRight';
import Head from '~/components/Head';
import { H1 } from '~/components/base/headings';
import navigation from '~/constants/navigation-deprecated';
import * as Constants from '~/constants/theme';
import { usePageApiVersion } from '~/providers/page-api-version';
import { NavigationRoute } from '~/types/common';

const STYLES_DOCUMENT = css`
  background: ${theme.background.default};
  margin: 0 auto;
  padding: 40px 56px;

  hr {
    border: 0;
    height: 0.01rem;
    background-color: ${theme.border.default};
  }

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    padding: 20px 16px 48px 16px;
  }
`;

const HIDDEN_ON_MOBILE = css`
  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    display: none;
  }
`;

const HIDDEN_ON_DESKTOP = css`
  @media screen and (min-width: ${Constants.breakpoints.mobile}) {
    display: none;
  }
`;

type Props = React.PropsWithChildren<{
  router: NextRouter;
  title: string;
  sourceCodeUrl?: string;
  tocVisible: boolean;
  /** If the page should not show up in the Algolia Docsearch results */
  hideFromSearch?: boolean;
  version: string;
}>;

type State = {
  isMenuActive: boolean;
  isMobileSearchActive: boolean;
};

class DocumentationPageWithApiVersion extends React.Component<Props, State> {
  state = {
    isMenuActive: false,
    isMobileSearchActive: false,
  };

  private layoutRef = React.createRef<DocumentationNestedScrollLayout>();
  private sidebarRightRef = React.createRef<SidebarRightComponentType>();

  componentDidMount() {
    Router.events.on('routeChangeStart', () => {
      if (this.layoutRef.current) {
        window.__sidebarScroll = this.layoutRef.current.getSidebarScrollTop();
      }
    });
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    if (WindowUtils.getViewportSize().width >= Constants.breakpoints.mobileValue) {
      window.scrollTo(0, 0);
    }
  };

  private handleShowMenu = () => {
    this.setState({
      isMenuActive: true,
    });
    this.handleHideSearch();
  };

  private handleHideMenu = () => {
    this.setState({
      isMenuActive: false,
    });
  };

  private handleToggleSearch = () => {
    this.setState(prevState => ({
      isMobileSearchActive: !prevState.isMobileSearchActive,
    }));
  };

  private handleHideSearch = () => {
    this.setState({
      isMobileSearchActive: false,
    });
  };

  private isReferencePath = () => {
    return this.props.router.pathname.startsWith('/versions');
  };

  private isGeneralPath = () => {
    return some(navigation.generalDirectories, name =>
      this.props.router.pathname.startsWith(`/${name}`)
    );
  };

  private isGettingStartedPath = () => {
    return (
      this.props.router.pathname === '/' ||
      some(navigation.startingDirectories, name =>
        this.props.router.pathname.startsWith(`/${name}`)
      )
    );
  };

  private isFeaturePreviewPath = () => {
    return some(navigation.featurePreviewDirectories, name =>
      this.props.router.pathname.startsWith(`/${name}`)
    );
  };

  private isPreviewPath = () => {
    return some(navigation.previewDirectories, name =>
      this.props.router.pathname.startsWith(`/${name}`)
    );
  };

  private isEasPath = () => {
    return some(navigation.easDirectories, name =>
      this.props.router.pathname.startsWith(`/${name}`)
    );
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
      return navigation.reference[this.props.version];
    } else {
      return navigation[this.getActiveTopLevelSection()];
    }
  };

  private getActiveTopLevelSection = () => {
    if (this.isReferencePath()) {
      return 'reference';
    } else if (this.isGeneralPath()) {
      return 'general';
    } else if (this.isGettingStartedPath()) {
      return 'starting';
    } else if (this.isFeaturePreviewPath()) {
      return 'featurePreview';
    } else if (this.isPreviewPath()) {
      return 'preview';
    } else if (this.isEasPath()) {
      return 'eas';
    }

    return 'general';
  };

  render() {
    const sidebarScrollPosition = process.browser ? window.__sidebarScroll : 0;
    const routes = this.getRoutes();

    const headerElement = (
      <DocumentationHeader
        activeSection={this.getActiveTopLevelSection()}
        isMenuActive={this.state.isMenuActive}
        isMobileSearchActive={this.state.isMobileSearchActive}
        isAlgoliaSearchHidden={this.state.isMenuActive}
        onShowMenu={this.handleShowMenu}
        onHideMenu={this.handleHideMenu}
        onToggleSearch={this.handleToggleSearch}
      />
    );

    const sidebarElement = <DocumentationSidebar router={this.props.router} routes={routes} />;

    const handleContentScroll = (contentScrollPosition: number) => {
      window.requestAnimationFrame(() => {
        if (this.sidebarRightRef && this.sidebarRightRef.current) {
          this.sidebarRightRef.current.handleContentScroll(contentScrollPosition);
        }
      });
    };

    const sidebarRight = <DocumentationSidebarRight ref={this.sidebarRightRef} />;

    const algoliaTag = this.getAlgoliaTag();

    return (
      <DocumentationNestedScrollLayout
        ref={this.layoutRef}
        header={headerElement}
        sidebar={sidebarElement}
        sidebarRight={sidebarRight}
        tocVisible={this.props.tocVisible}
        isMenuActive={this.state.isMenuActive}
        isMobileSearchActive={this.state.isMobileSearchActive}
        onContentScroll={handleContentScroll}
        sidebarScrollPosition={sidebarScrollPosition}>
        <Head title={this.props.title}>
          {algoliaTag !== null && <meta name="docsearch:version" content={algoliaTag} />}
          <meta property="og:title" content={`${this.props.title} - Expo Documentation`} />
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
          <meta property="twitter:title" content={`${this.props.title} - Expo Documentation`} />
          <meta
            name="twitter:description"
            content="Expo is an open-source platform for making universal native apps for Android, iOS, and the web with JavaScript and React."
          />
          <meta
            property="twitter:image"
            content="https://docs.expo.dev/static/images/twitter.png"
          />

          {(this.props.version === 'unversioned' || this.isPreviewPath()) && (
            <meta name="robots" content="noindex" />
          )}
          {this.props.version !== 'unversioned' && (
            <link rel="canonical" href={this.getCanonicalUrl()} />
          )}
        </Head>

        {!this.state.isMenuActive ? (
          <div css={STYLES_DOCUMENT}>
            <H1>{this.props.title}</H1>
            {this.props.children}
            <DocumentationFooter
              router={this.props.router}
              title={this.props.title}
              sourceCodeUrl={this.props.sourceCodeUrl}
            />
          </div>
        ) : (
          <div>
            <div css={[STYLES_DOCUMENT, HIDDEN_ON_MOBILE]}>
              <H1>{this.props.title}</H1>
              {this.props.children}
              <DocumentationFooter
                router={this.props.router}
                title={this.props.title}
                sourceCodeUrl={this.props.sourceCodeUrl}
              />
            </div>
            <div css={HIDDEN_ON_DESKTOP}>
              <DocumentationSidebar router={this.props.router} routes={routes} />
            </div>
          </div>
        )}
      </DocumentationNestedScrollLayout>
    );
  }
}

export default function DocumentationPage(props: Omit<Props, 'version'>) {
  const { version } = usePageApiVersion();
  return <DocumentationPageWithApiVersion {...props} version={version} />;
}
