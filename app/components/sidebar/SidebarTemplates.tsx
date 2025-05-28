import React from 'react';
import type { Template } from '~/types/template';
import { STARTER_TEMPLATES } from '~/utils/constants';

interface FrameworkLinkProps {
  template: Template;
}

const FrameworkLink: React.FC<FrameworkLinkProps> = ({ template }) => (
  <a
    href={`/git?url=https://github.com/${template.githubRepo}.git`}
    data-state="closed"
    data-discover="true"
    className="group flex flex-col items-center justify-center p-3 rounded-xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50 dark:hover:from-purple-900/20 dark:hover:to-blue-900/20 transition-all duration-300 w-1/6 border border-transparent hover:border-purple-200 dark:hover:border-purple-700/50 hover:shadow-lg hover:scale-105"
    title={template.label}
  >
    <div className="relative">
      <div
        className={`${template.icon} w-8 h-8 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300 mb-2`}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/10 group-hover:to-blue-500/10 rounded-full transition-all duration-300" />
    </div>
    {/* <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-700 dark:group-hover:text-purple-300 truncate text-center w-full transition-colors duration-300">
      {template.label}
    </span> */}
  </a>
);

const SidebarTemplates: React.FC = () => {
  return (
    <div className="px-4 py-6 border-t border-gray-200 dark:border-gray-800 bg-gradient-to-b from-gray-50/50 to-transparent dark:from-gray-900/50">
      <div className="flex items-center gap-2 mb-4 px-2">
        <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
        <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
          Démarrer un projet
        </h3>
      </div>
      <div className="flex flex-wrap gap-1 bg-white/50 dark:bg-gray-900/50 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
        {STARTER_TEMPLATES.map((template) => (
          <FrameworkLink key={template.name} template={template} />
        ))}
      </div>
    </div>
  );
};

export default SidebarTemplates;