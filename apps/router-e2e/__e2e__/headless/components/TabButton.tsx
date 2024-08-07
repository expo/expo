import { css, html } from 'react-strict-dom';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinkProps, Href, Link } from 'expo-router';
import { ComponentProps } from 'react';

type Icon = ComponentProps<typeof FontAwesome>['name'];

export type TabButtonProps<T extends string | object> = Omit<LinkProps<any>, 'href'> & {
  href?: Href<T>;
  icon: Icon;
};

export function TabButton<T extends string | object>({
  icon,
  children,
  ...props
}: TabButtonProps<T>) {
  return (
    <Link href="/" {...props}>
      <FontAwesome name={icon} size={24} color="black" />
      <html.div style={styles.tabTriggerText}>{children}</html.div>
    </Link>
  );
}

const styles = css.create({
  root: {
    backgroundColor: '#DDDDDD',
    flex: 1,
  },
  tabList: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  tabTrigger: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'column',
    gap: 5,
    padding: 10,
  },
  tabTriggerText: {
    fontSize: 16,
  },
});
