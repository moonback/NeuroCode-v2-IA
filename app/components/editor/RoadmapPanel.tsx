import { memo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  roadmapTasks,
  addRoadmapTask,
  toggleRoadmapTask,
  removeRoadmapTask,
  clearRoadmap,
} from '~/lib/stores/roadmap';
import { classNames } from '~/utils/classNames';

const RoadmapPanel = memo(() => {
  const tasks = useStore(roadmapTasks);
  const [newTask, setNewTask] = useState('');

  const handleAdd = () => {
    if (newTask.trim()) {
      addRoadmapTask(newTask.trim());
      setNewTask('');
    }
  };

  const taskList = Object.values(tasks);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b border-bolt-elements-borderColor">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Nouvelle tâche..."
          className="flex-1 rounded-md border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-2 py-1 text-xs text-bolt-elements-textPrimary"
        />
        <button
          onClick={handleAdd}
          className="ml-2 rounded bg-bolt-elements-button-primary-background px-3 py-1 text-xs text-bolt-elements-button-primary-text hover:bg-bolt-elements-button-primary-backgroundHover"
        >
          Ajouter
        </button>
        {taskList.length > 0 && (
          <button
            onClick={() => clearRoadmap()}
            className="ml-2 rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
          >
            Tout effacer
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {taskList.length === 0 ? (
          <p className="text-center text-sm text-bolt-elements-textSecondary">Aucune tâche pour le moment.</p>
        ) : (
          taskList.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between rounded border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleRoadmapTask(task.id)}
                  className="h-4 w-4"
                />
                <span className={classNames('text-sm', task.completed && 'line-through text-bolt-elements-textTertiary')}>
                  {task.title}
                </span>
              </div>
              <button
                onClick={() => removeRoadmapTask(task.id)}
                className="text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary"
              >
                <div className="i-ph:trash text-base" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

export default RoadmapPanel;
