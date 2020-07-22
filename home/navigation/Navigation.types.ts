export type ExploreAndSearchRoute = {};
export type ProjectsForUserRoute = { username: string; belongsToCurrentUser?: boolean };
export type SnacksForUserRoute = { username: string; belongsToCurrentUser?: boolean };
export type ProfileRoute = { username: string };

export type ExploreStackRoutes = {
  ExploreAndSearch: ExploreAndSearchRoute;
  Profile: ProfileRoute;
  ProjectsForUser: ProjectsForUserRoute;
  SnacksForUser: SnacksForUserRoute;
};

export type Links = {};
