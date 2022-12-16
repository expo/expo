import { StoriesExport, File, Story } from './types';

export function getByFileId(stories: StoriesExport) {
  const filesById: Record<string, File> = Object.keys(stories).reduce((acc, storyId) => {
    const story = stories[storyId];

    if (!acc[story.file.id]) {
      acc[story.file.id] = {
        ...story.file,
        storyIds: [],
      };
    }

    acc[story.file.id].storyIds.push(storyId);

    return acc;
  }, {});

  return filesById;
}

export function getByStoryId(stories: StoriesExport) {
  const storiesById: Record<string, Story> = Object.keys(stories).reduce((acc, id) => {
    const story = stories[id];

    acc[story.storyConfig.id] = {
      ...story.storyConfig,
      file: story.file,
      component: stories[story.storyConfig.id] || null,
    };

    return acc;
  }, {});

  return storiesById;
}
