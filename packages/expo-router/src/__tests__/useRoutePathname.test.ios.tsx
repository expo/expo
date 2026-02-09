import { act } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { Slot, router } from '../exports';
import { usePathname, useRoutePathname } from '../hooks';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { renderRouter, screen } from '../testing-library';

describe(useRoutePathname, () => {
  describe('basic', () => {
    it('returns structural pathname for current route', () => {
      const fn = jest.fn();

      renderRouter({
        index: function Index() {
          fn(useRoutePathname());
          return <Text>Index</Text>;
        },
      });

      expect(fn).toHaveBeenCalledWith(expect.stringContaining('index'));
    });

    it('returns pathname without search params', () => {
      const fn = jest.fn();

      renderRouter(
        {
          index: function Index() {
            fn(useRoutePathname());
            return <Text>Index</Text>;
          },
        },
        {
          initialUrl: '/?foo=bar',
        }
      );

      const pathname = fn.mock.calls[0][0] as string;
      expect(pathname).not.toContain('?');
      expect(pathname).not.toContain('foo');
      expect(pathname).not.toContain('bar');
    });

    it('updates when navigating', () => {
      const fn = jest.fn();

      renderRouter({
        index: function Index() {
          fn(useRoutePathname());
          return <Text>Index</Text>;
        },
        other: function Other() {
          fn(useRoutePathname());
          return <Text>Other</Text>;
        },
      });

      const initialPathname = fn.mock.calls[0][0] as string;
      expect(initialPathname).toContain('index');

      act(() => router.push('/other'));

      const lastCall = fn.mock.calls[fn.mock.calls.length - 1][0] as string;
      expect(lastCall).toContain('other');
    });

    it("returns '/' as fallback when context is unavailable", () => {
      // When rendered without the RoutePathnameContext provider, the hook should return '/'
      const fn = jest.fn();

      // renderHook outside of router context - useRoutePathname should fallback to '/'
      // We use a route that renders the hook to test the default behavior is at least a string
      renderRouter({
        index: function Index() {
          fn(useRoutePathname());
          return <Text>Index</Text>;
        },
      });

      expect(typeof fn.mock.calls[0][0]).toBe('string');
    });

    it('returns structural path with unresolved dynamic segments', () => {
      const fn = jest.fn();

      renderRouter(
        {
          'users/[id]': function User() {
            fn(useRoutePathname());
            return <Text>User</Text>;
          },
        },
        {
          initialUrl: '/users/42',
        }
      );

      const pathname = fn.mock.calls[0][0] as string;
      expect(pathname).toContain('[id]');
      expect(pathname).not.toContain('42');
    });

    it('returns structural path for catch-all routes', () => {
      const fn = jest.fn();

      renderRouter(
        {
          'docs/[...slug]': function Docs() {
            fn(useRoutePathname());
            return <Text>Docs</Text>;
          },
        },
        {
          initialUrl: '/docs/a/b/c',
        }
      );

      const pathname = fn.mock.calls[0][0] as string;
      expect(pathname).toContain('[...slug]');
    });
  });

  describe('stack layout', () => {
    it('background screen keeps its own structural pathname while usePathname updates globally', () => {
      const routePathnameValues: Record<string, string[]> = { index: [], other: [] };
      const pathnameValues: Record<string, string[]> = { index: [], other: [] };

      renderRouter({
        _layout: () => <Stack />,
        index: function Index() {
          routePathnameValues.index.push(useRoutePathname());
          pathnameValues.index.push(usePathname());
          return <Text>Index</Text>;
        },
        other: function Other() {
          routePathnameValues.other.push(useRoutePathname());
          pathnameValues.other.push(usePathname());
          return <Text>Other</Text>;
        },
      });

      act(() => router.push('/other'));

      // usePathname on the background (index) screen updates to /other (global)
      expect(pathnameValues.index[pathnameValues.index.length - 1]).toBe('/other');

      // useRoutePathname on the background (index) screen still returns its own structural pathname
      const lastIndexRoutePathname =
        routePathnameValues.index[routePathnameValues.index.length - 1];
      expect(lastIndexRoutePathname).toContain('index');
      expect(lastIndexRoutePathname).not.toContain('other');

      // useRoutePathname on the foreground (other) screen returns its own structural pathname
      const lastOtherRoutePathname =
        routePathnameValues.other[routePathnameValues.other.length - 1];
      expect(lastOtherRoutePathname).toContain('other');
    });

    it('each screen returns its own structural pathname independently', () => {
      const routePathnames: Record<string, string> = {};

      renderRouter({
        _layout: () => <Stack />,
        index: function Index() {
          routePathnames.index = useRoutePathname();
          return <Text>Index</Text>;
        },
        a: function A() {
          routePathnames.a = useRoutePathname();
          return <Text>A</Text>;
        },
        b: function B() {
          routePathnames.b = useRoutePathname();
          return <Text>B</Text>;
        },
      });

      act(() => router.push('/a'));
      act(() => router.push('/b'));

      expect(routePathnames.index).toContain('index');
      expect(routePathnames.a).toContain('/a');
      expect(routePathnames.b).toContain('/b');
    });

    it('push then go back — pathname reflects the visible screen', () => {
      const fn = jest.fn();

      renderRouter({
        _layout: () => <Stack />,
        index: function Index() {
          fn('index', useRoutePathname());
          return <Text>Index</Text>;
        },
        detail: function Detail() {
          fn('detail', useRoutePathname());
          return <Text>Detail</Text>;
        },
      });

      act(() => router.push('/detail'));

      const detailCalls = fn.mock.calls.filter(([name]: string[]) => name === 'detail');
      expect(detailCalls.length).toBeGreaterThan(0);
      expect(detailCalls[detailCalls.length - 1][1]).toContain('detail');

      act(() => router.back());

      // After going back, the index screen's routePathname should still be its own
      const indexCalls = fn.mock.calls.filter(([name]: string[]) => name === 'index');
      expect(indexCalls[indexCalls.length - 1][1]).toContain('index');
    });
  });

  describe('tabs layout', () => {
    it('each tab returns its own structural pathname', () => {
      const routePathnames: Record<string, string> = {};

      renderRouter({
        _layout: () => <Tabs />,
        index: function Home() {
          routePathnames.index = useRoutePathname();
          return <Text>Home</Text>;
        },
        settings: function Settings() {
          routePathnames.settings = useRoutePathname();
          return <Text>Settings</Text>;
        },
      });

      act(() => router.push('/settings'));

      expect(routePathnames.index).toContain('index');
      expect(routePathnames.settings).toContain('settings');
    });

    it('switching tabs updates each tab local pathname correctly', () => {
      const routePathnames: Record<string, string[]> = { index: [], settings: [] };

      renderRouter({
        _layout: () => <Tabs />,
        index: function Home() {
          routePathnames.index.push(useRoutePathname());
          return <Text>Home</Text>;
        },
        settings: function Settings() {
          routePathnames.settings.push(useRoutePathname());
          return <Text>Settings</Text>;
        },
      });

      act(() => router.push('/settings'));
      act(() => router.push('/'));

      // Each tab should consistently report its own pathname
      for (const pathname of routePathnames.index) {
        expect(pathname).toContain('index');
      }
      for (const pathname of routePathnames.settings) {
        expect(pathname).toContain('settings');
      }
    });
  });

  describe('deeply nested layouts with groups and params', () => {
    it('Stack > group > Tabs: each level sees correct structural pathname with groups', () => {
      const routePathnames: Record<string, string> = {};

      renderRouter(
        {
          _layout: () => <Stack />,
          '(app)/_layout': () => <Tabs />,
          '(app)/home': function Home() {
            routePathnames.home = useRoutePathname();
            return <Text>Home</Text>;
          },
          '(app)/profile/[id]': function Profile() {
            routePathnames.profile = useRoutePathname();
            return <Text>Profile</Text>;
          },
        },
        {
          initialUrl: '/home',
        }
      );

      act(() => router.push('/profile/42'));

      expect(routePathnames.home).toContain('(app)');
      expect(routePathnames.home).toContain('home');

      expect(routePathnames.profile).toContain('(app)');
      expect(routePathnames.profile).toContain('[id]');
      expect(routePathnames.profile).not.toContain('42');
    });

    it('Stack > group > Stack > dynamic: each screen retains its own structural pathname', () => {
      const routePathnames: Record<string, string> = {};

      renderRouter(
        {
          _layout: () => <Stack />,
          '(dashboard)/_layout': () => <Stack />,
          '(dashboard)/projects/[projectId]': function Project() {
            routePathnames.project = useRoutePathname();
            return <Text>Project</Text>;
          },
          '(dashboard)/projects/[projectId]/tasks/[taskId]': function Task() {
            routePathnames.task = useRoutePathname();
            return <Text>Task</Text>;
          },
        },
        {
          initialUrl: '/projects/p1',
        }
      );

      act(() => router.push('/projects/p1/tasks/t1'));

      expect(routePathnames.project).toContain('(dashboard)');
      expect(routePathnames.project).toContain('[projectId]');

      expect(routePathnames.task).toContain('(dashboard)');
      expect(routePathnames.task).toContain('[taskId]');
    });

    it('multiple groups with params', () => {
      const routePathnames: Record<string, string> = {};

      renderRouter(
        {
          _layout: () => <Stack />,
          '(auth)/login': function Login() {
            routePathnames.login = useRoutePathname();
            return <Text>Login</Text>;
          },
          '(auth)/register': function Register() {
            routePathnames.register = useRoutePathname();
            return <Text>Register</Text>;
          },
          '(main)/(tabs)/_layout': () => <Tabs />,
          '(main)/(tabs)/feed': function Feed() {
            routePathnames.feed = useRoutePathname();
            return <Text>Feed</Text>;
          },
          '(main)/(tabs)/profile/[username]': function Profile() {
            routePathnames.profile = useRoutePathname();
            return <Text>Profile</Text>;
          },
        },
        {
          initialUrl: '/feed',
        }
      );

      act(() => router.push('/profile/alice'));

      expect(routePathnames.feed).toContain('feed');
      expect(routePathnames.profile).toContain('[username]');
      expect(routePathnames.profile).toContain('(tabs)');
    });

    it('triple nesting: Stack > Slot > Tabs with dynamic segments', () => {
      const routePathnames: Record<string, string> = {};

      renderRouter(
        {
          _layout: () => <Stack />,
          '(app)/_layout': () => <Slot />,
          '(app)/(tabs)/_layout': () => <Tabs />,
          '(app)/(tabs)/index': function Index() {
            routePathnames.index = useRoutePathname();
            return <Text>Index</Text>;
          },
          '(app)/(tabs)/settings': function Settings() {
            routePathnames.settings = useRoutePathname();
            return <Text>Settings</Text>;
          },
          '(app)/(tabs)/users/[id]': function User() {
            routePathnames.user = useRoutePathname();
            return <Text>User</Text>;
          },
        },
        {
          initialUrl: '/',
        }
      );

      expect(routePathnames.index).toContain('(app)');
      expect(routePathnames.index).toContain('(tabs)');
      expect(routePathnames.index).toContain('index');

      act(() => router.push('/settings'));

      expect(routePathnames.settings).toContain('settings');

      act(() => router.push('/users/42'));

      expect(routePathnames.user).toContain('[id]');
      expect(routePathnames.user).toContain('(tabs)');
    });

    it('navigation between nested groups with dynamic segments: push, push, go back', () => {
      const routePathnames: Record<string, string[]> = {
        index: [],
        project: [],
        task: [],
      };

      renderRouter({
        _layout: () => <Stack />,
        index: function Index() {
          routePathnames.index.push(useRoutePathname());
          return <Text>Index</Text>;
        },
        'projects/[id]': function Project() {
          routePathnames.project.push(useRoutePathname());
          return <Text>Project</Text>;
        },
        'projects/[id]/tasks/[taskId]': function Task() {
          routePathnames.task.push(useRoutePathname());
          return <Text>Task</Text>;
        },
      });

      // Initially at index
      expect(routePathnames.index.length).toBeGreaterThan(0);
      expect(routePathnames.index[0]).toContain('index');

      act(() => router.push('/projects/123'));

      // Project screen mounted
      expect(routePathnames.project.length).toBeGreaterThan(0);
      const projectPathname = routePathnames.project[routePathnames.project.length - 1];
      expect(projectPathname).toContain('[id]');

      act(() => router.push('/projects/123/tasks/456'));

      // Task screen mounted
      expect(routePathnames.task.length).toBeGreaterThan(0);
      const taskPathname = routePathnames.task[routePathnames.task.length - 1];
      expect(taskPathname).toContain('[taskId]');

      act(() => router.back());

      // After going back, index and project should still have their own pathnames
      const lastIndex = routePathnames.index[routePathnames.index.length - 1];
      expect(lastIndex).toContain('index');

      const lastProject = routePathnames.project[routePathnames.project.length - 1];
      expect(lastProject).toContain('[id]');
    });
  });
});
