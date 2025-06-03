import { useEffect, useState, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { classNames } from '~/utils/classNames';
import type { AgentInfo, AgentCategory } from '~/types/agent';

interface AgentSelectorProps {
  selectedAgent?: AgentInfo | null;
  setSelectedAgent?: (agent: AgentInfo | null) => void;
  agentList: AgentInfo[];
  disabled?: boolean;
}

export const AgentSelector = ({
  selectedAgent,
  setSelectedAgent,
  agentList,
  disabled = false,
}: AgentSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [selectedCategory, setSelectedCategory] = useState<AgentCategory | 'all'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<(HTMLDivElement | null)[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Catégories disponibles
  const categories: { id: AgentCategory | 'all'; label: string; icon: string }[] = [
    { id: 'all', label: 'Tous', icon: 'i-ph:list-duotone' },
    { id: 'development', label: 'Développement', icon: 'i-ph:code-duotone' },
    { id: 'design', label: 'Design', icon: 'i-ph:paint-brush-duotone' },
    { id: 'data', label: 'Données', icon: 'i-ph:database-duotone' },
    { id: 'devops', label: 'DevOps', icon: 'i-ph:git-branch-duotone' },
    { id: 'general', label: 'Général', icon: 'i-ph:robot-duotone' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAgents = agentList
    .filter(
      (agent) =>
        (selectedCategory === 'all' || agent.category === selectedCategory) &&
        (agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.description.toLowerCase().includes(searchQuery.toLowerCase())),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchQuery, isDropdownOpen, selectedCategory]);

  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isDropdownOpen) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1 >= filteredAgents.length ? 0 : prev + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 < 0 ? filteredAgents.length - 1 : prev - 1));
        break;
      case 'Enter':
        e.preventDefault();

        if (focusedIndex >= 0 && focusedIndex < filteredAgents.length) {
          const selectedAgent = filteredAgents[focusedIndex];
          setSelectedAgent?.(selectedAgent);
          setIsDropdownOpen(false);
          setSearchQuery('');
        }

        break;
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        setSearchQuery('');
        break;
      case 'Tab':
        if (!e.shiftKey && focusedIndex === filteredAgents.length - 1) {
          setIsDropdownOpen(false);
        }

        break;
    }
  };

  useEffect(() => {
    if (focusedIndex >= 0 && optionsRef.current[focusedIndex]) {
      optionsRef.current[focusedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

  return (
    <div className="mb-4">
      <div className="text-sm font-medium mb-2 text-bolt-elements-textPrimary">Agent spécialisé</div>
      <div className="relative flex w-full" onKeyDown={handleKeyDown} ref={dropdownRef}>
        <div
          className={classNames(
            'w-full p-2 rounded-lg border border-bolt-elements-borderColor',
            'bg-bolt-elements-prompt-background text-bolt-elements-textPrimary',
            'focus-within:outline-none focus-within:ring-2 focus-within:ring-bolt-elements-focus',
            'transition-all',
            isDropdownOpen ? 'ring-2 ring-bolt-elements-focus' : undefined,
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          )}
          onClick={() => {
            if (!disabled) {
              setIsDropdownOpen(!isDropdownOpen);
            }
          }}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsDropdownOpen(!isDropdownOpen);
            }
          }}
          role="combobox"
          aria-expanded={isDropdownOpen}
          aria-controls="agent-listbox"
          aria-haspopup="listbox"
          tabIndex={disabled ? -1 : 0}
        >
          <div className="flex items-center justify-between">
            {selectedAgent ? (
              <div className="flex items-center gap-2 truncate">
                <div className={classNames(
                  selectedAgent.icon, 
                  'w-5 h-5',
                  'text-bolt-elements-accent animate-pulse',
                )} />
                <div className="flex flex-col">
                  <span className="truncate font-medium text-bolt-elements-accent">{selectedAgent.name}</span>
                  <span className="text-xs text-bolt-elements-textSecondary truncate">Agent actif</span>
                </div>
              </div>
            ) : (
              <div className="text-bolt-elements-textTertiary">Sélectionner un agent spécialisé</div>
            )}
            <div
              className={classNames(
                'i-ph:caret-down w-4 h-4 text-bolt-elements-textSecondary opacity-75',
                isDropdownOpen ? 'rotate-180' : undefined,
              )}
            />
          </div>
        </div>

        {isDropdownOpen && (
          <div
            className="absolute z-20 w-full mt-1 py-1 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 shadow-lg"
            role="listbox"
            id="agent-listbox"
          >
            <div className="px-2 pb-2">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un agent..."
                  className={classNames(
                    'w-full pl-8 py-1.5 rounded-md text-sm',
                    'bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor',
                    'text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary',
                    'focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus',
                    'transition-all',
                  )}
                  onClick={(e) => e.stopPropagation()}
                  role="searchbox"
                  aria-label="Rechercher un agent"
                />
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
                  <span className="i-ph:magnifying-glass text-bolt-elements-textTertiary" />
                </div>
              </div>
            </div>

            {/* Filtres par catégorie */}
            <div className="px-2 pb-2 flex flex-wrap gap-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={classNames(
                    'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
                    'transition-all',
                    selectedCategory === category.id
                      ? 'bg-bolt-elements-background-depth-3 text-bolt-elements-textPrimary'
                      : 'bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-3',
                  )}
                >
                  <div className={classNames(category.icon, 'w-3.5 h-3.5')} />
                  {category.label}
                </button>
              ))}
            </div>

            <div
              className={classNames(
                'max-h-60 overflow-y-auto',
                'sm:scrollbar-none',
                '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2',
                '[&::-webkit-scrollbar-thumb]:bg-bolt-elements-borderColor',
                '[&::-webkit-scrollbar-thumb]:hover:bg-bolt-elements-borderColorHover',
                '[&::-webkit-scrollbar-thumb]:rounded-full',
                '[&::-webkit-scrollbar-track]:bg-bolt-elements-background-depth-2',
                '[&::-webkit-scrollbar-track]:rounded-full',
                'sm:[&::-webkit-scrollbar]:w-1.5 sm:[&::-webkit-scrollbar]:h-1.5',
                'sm:hover:[&::-webkit-scrollbar-thumb]:bg-bolt-elements-borderColor/50',
                'sm:hover:[&::-webkit-scrollbar-thumb:hover]:bg-bolt-elements-borderColor',
                'sm:[&::-webkit-scrollbar-track]:bg-transparent',
              )}
            >
              {filteredAgents.length === 0 ? (
                <div className="px-3 py-2 text-sm text-bolt-elements-textTertiary">Aucun agent trouvé</div>
              ) : (
                filteredAgents.map((agent, index) => (
                  <div
                    ref={(el) => (optionsRef.current[index] = el)}
                    key={agent.id}
                    role="option"
                    aria-selected={selectedAgent?.id === agent.id}
                    className={classNames(
                      'px-3 py-2 cursor-pointer',
                      'hover:bg-bolt-elements-background-depth-3',
                      'text-bolt-elements-textPrimary',
                      'outline-none',
                      selectedAgent?.id === agent.id || focusedIndex === index
                        ? 'bg-bolt-elements-background-depth-2'
                        : undefined,
                      focusedIndex === index ? 'ring-1 ring-inset ring-bolt-elements-focus' : undefined,
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAgent?.(agent);
                      setIsDropdownOpen(false);
                      setSearchQuery('');
                    }}
                    tabIndex={focusedIndex === index ? 0 : -1}
                  >
                    <div className="flex items-center gap-2">
                      <div className={classNames(agent.icon, 'w-5 h-5')} />
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-xs text-bolt-elements-textSecondary">{agent.description}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};