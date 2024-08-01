import * as stylex from '@stylexjs/stylex';
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
      <html.div {...stylex.props(styles.tabTriggerText)}>{children}</html.div>
    </Link>
  );
}

const styles = css.create({
  tabTriggerText: {
    fontSize: 16,
  },
});
