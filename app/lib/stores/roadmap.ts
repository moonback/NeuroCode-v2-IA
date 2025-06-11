import { atom, map } from 'nanostores';
import { getLocalStorage, setLocalStorage } from '~/lib/persistence/localStorage';
import { createScopedLogger } from '~/utils/logger';
import { getCurrentChatId } from '~/utils/fileLocks';

const logger = createScopedLogger('RoadmapStore');

export const ROADMAP_KEY = 'bolt.roadmap';

export interface RoadmapTask {
  id: string;
  title: string;
  completed: boolean;
}

export const roadmapTasks = map<Record<string, RoadmapTask>>({});

const projectRoadmaps = new Map<string, Record<string, RoadmapTask>>();

function getCurrentProjectRoadmap(): Record<string, RoadmapTask> {
  const chatId = getCurrentChatId();
  if (!projectRoadmaps.has(chatId)) {
    projectRoadmaps.set(chatId, {});
  }
  return projectRoadmaps.get(chatId) || {};
}

function initializeRoadmap() {
  try {
    const saved = getLocalStorage(ROADMAP_KEY);
    if (saved && typeof saved === 'object' && saved.byProject) {
      Object.entries(saved.byProject).forEach(([chatId, tasks]) => {
        const processed: Record<string, RoadmapTask> = {};
        Object.entries(tasks as Record<string, RoadmapTask>).forEach(([id, task]) => {
          processed[id] = task as RoadmapTask;
        });
        projectRoadmaps.set(chatId, processed);
      });
      const current = getCurrentProjectRoadmap();
      roadmapTasks.set(current);
    }
  } catch (error) {
    logger.error('Erreur lors du chargement de la roadmap', error);
  }
}

function saveRoadmap() {
  try {
    const chatId = getCurrentChatId();
    const currentTasks = roadmapTasks.get();
    projectRoadmaps.set(chatId, currentTasks);

    const all: Record<string, Record<string, RoadmapTask>> = {};
    projectRoadmaps.forEach((tasks, id) => {
      all[id] = tasks;
    });
    setLocalStorage(ROADMAP_KEY, { byProject: all });
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde de la roadmap', error);
  }
}

if (typeof window !== 'undefined') {
  initializeRoadmap();
  window.addEventListener('popstate', () => {
    const chatId = getCurrentChatId();
    const projectRoadmap = projectRoadmaps.get(chatId) || {};
    roadmapTasks.set(projectRoadmap);
  });
}

roadmapTasks.listen(() => {
  saveRoadmap();
});

export function addRoadmapTask(title: string) {
  const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const newTask: RoadmapTask = { id, title, completed: false };
  roadmapTasks.setKey(id, newTask);
  return id;
}

export function toggleRoadmapTask(id: string) {
  const task = roadmapTasks.get()[id];
  if (task) {
    roadmapTasks.setKey(id, { ...task, completed: !task.completed });
  }
}

export function removeRoadmapTask(id: string) {
  const tasks = { ...roadmapTasks.get() };
  delete tasks[id];
  roadmapTasks.set(tasks);
}

export function clearRoadmap() {
  roadmapTasks.set({});
}

export function switchProjectRoadmap(chatId: string) {
  const currentChatId = getCurrentChatId();
  projectRoadmaps.set(currentChatId, roadmapTasks.get());
  const project = projectRoadmaps.get(chatId) || {};
  roadmapTasks.set(project);
  saveRoadmap();
}
