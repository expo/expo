export type NavigationType = 'section' | 'group' | 'page';

export type NavigationNode = Section | Group | Page;

export type NavigationRenderProps = {
  /** The navigation node or route to render */
  route: NavigationNode;
  /** If this navigation node is considered "active", e.g. current page or containing current page */
  isActive?: boolean;
};

export type Node<Type extends NavigationType, Data extends object> = Data & {
  /** The type of the navigation node */
  type: Type;
  /** The name of the navigation node */
  name: string;
  /** If this navigation node should be rendered */
  hidden?: boolean;
};

export type Section = Node<
  'section',
  {
    /** The groups or pages it should render within the collapsible section */
    children: (Group | Page)[];
    /** If the section should be rendered as "closed" by default. Defaults to false. */
    expanded?: boolean;
  }
>;

export type Group = Node<
  'group',
  {
    /** The pages it should render within the group list */
    children: Page[];
  }
>;

export type Page = Node<
  'page',
  {
    /** The display text of the link in the sidebar, falls back to `name` */
    sidebarTitle?: string;
    /** The pathname to link to the page */
    href: string;
  }
>;
