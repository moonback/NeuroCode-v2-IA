import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRightIcon, ClipboardIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CodeBracketIcon } from '@heroicons/react/24/solid';

interface ElementInfo {
  tagName: string;
  className: string;
  id: string;
  textContent: string;
  styles: Record<string, string>; // Changed from CSSStyleDeclaration
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    left: number;
  };
}

interface InspectorPanelProps {
  selectedElement: ElementInfo | null;
  isVisible: boolean;
  onClose: () => void;
}

export const InspectorPanel = ({ selectedElement, isVisible, onClose }: InspectorPanelProps) => {
  const [activeTab, setActiveTab] = useState<'styles' | 'computed' | 'box'>('styles');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['layout', 'appearance']));
  const [searchTerm, setSearchTerm] = useState('');

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isVisible || !selectedElement) {
    return null;
  }

  const getStylesByCategory = (styles: Record<string, string>) => {
    const categories = {
      layout: {
        title: 'Layout',
        icon: '📐',
        props: ['display', 'position', 'top', 'right', 'bottom', 'left', 'z-index', 'float', 'clear']
      },
      dimensions: {
        title: 'Dimensions',
        icon: '📏',
        props: ['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height']
      },
      spacing: {
        title: 'Spacing',
        icon: '📦',
        props: ['margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left']
      },
      appearance: {
        title: 'Appearance',
        icon: '🎨',
        props: ['background', 'background-color', 'color', 'border', 'border-radius', 'box-shadow', 'opacity']
      },
      typography: {
        title: 'Typography',
        icon: '📝',
        props: ['font-family', 'font-size', 'font-weight', 'line-height', 'text-align', 'text-decoration', 'letter-spacing']
      },
      flexbox: {
        title: 'Flexbox',
        icon: '🔄',
        props: ['flex-direction', 'justify-content', 'align-items', 'align-content', 'flex-wrap', 'gap']
      }
    };

    const result: Record<string, { title: string; icon: string; styles: Record<string, string> }> = {};

    Object.entries(categories).forEach(([key, category]) => {
      const categoryStyles: Record<string, string> = {};
      category.props.forEach(prop => {
        if (styles[prop]) {
          categoryStyles[prop] = styles[prop];
        }
      });
      
      if (Object.keys(categoryStyles).length > 0) {
        result[key] = {
          title: category.title,
          icon: category.icon,
          styles: categoryStyles
        };
      }
    });

    return result;
  };

  const filteredStyles = (styles: Record<string, string>) => {
    if (!searchTerm) return styles;
    return Object.fromEntries(
      Object.entries(styles).filter(([key, value]) => 
        key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 320, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 320, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed right-4 top-20 w-80 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg shadow-sm z-40 max-h-[calc(100vh-6rem)] overflow-hidden"
        >
          {/* Header */}
          <motion.div 
            className="flex items-center justify-between px-3 py-2 border-b border-bolt-elements-borderColor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2">
              <CodeBracketIcon className="w-4 h-4 text-bolt-elements-textSecondary" />
              <h3 className="text-sm font-medium text-bolt-elements-textPrimary">Element Inspector</h3>
            </div>
            <motion.button 
              onClick={onClose} 
              className="text-bolt-elements-item-contentDefault hover:text-bolt-elements-item-contentActive p-1 rounded hover:bg-bolt-elements-item-backgroundActive transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <XMarkIcon className="w-4 h-4" />
            </motion.button>
          </motion.div>

          {/* Element Info */}
          <motion.div 
            className="p-3 border-b border-bolt-elements-borderColor"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="text-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="font-mono text-bolt-elements-item-contentAccent text-sm font-medium">
                  {selectedElement.tagName.toLowerCase()}
                </div>
                {selectedElement.id && (
                  <motion.span 
                    className="text-bolt-elements-icon-success font-mono bg-bolt-elements-item-backgroundAccent px-2 py-0.5 rounded text-xs"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    #{selectedElement.id}
                  </motion.span>
                )}
                {selectedElement.className && (
                  <motion.span 
                    className="text-bolt-elements-textSecondary font-mono bg-bolt-elements-background-depth-1 px-2 py-0.5 rounded text-xs border border-bolt-elements-borderColor"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.25 }}
                  >
                    .{selectedElement.className.split(' ')[0]}
                  </motion.span>
                )}
              </div>
              {selectedElement.textContent && (
                <div className="mt-2 text-bolt-elements-textSecondary text-xs p-2 bg-bolt-elements-background-depth-1 rounded border border-bolt-elements-borderColor">
                  "{selectedElement.textContent.slice(0, 100)}{selectedElement.textContent.length > 100 ? '...' : ''}"
                </div>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-bolt-elements-textTertiary">
                <span>{Math.round(selectedElement.rect.width)}×{Math.round(selectedElement.rect.height)}px</span>
                <span>({Math.round(selectedElement.rect.left)}, {Math.round(selectedElement.rect.top)})</span>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div 
            className="flex border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {(['styles', 'computed', 'box'] as const).map((tab, index) => (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  flex-1 px-3 py-2 
                  flex items-center justify-center gap-1.5
                  text-sm font-medium capitalize
                  transition-all duration-200
                  ${activeTab === tab
                    ? 'text-bolt-elements-item-contentAccent border-b-2 border-bolt-elements-borderColorActive bg-bolt-elements-item-backgroundAccent'
                    : 'text-bolt-elements-item-contentDefault hover:text-bolt-elements-item-contentActive hover:bg-bolt-elements-item-backgroundActive'
                  }
                `}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 0.25 + index * 0.05,
                  duration: 0.2
                }}
              >
                <span className="text-xs">
                  {tab === 'styles' && '🎨'}
                  {tab === 'computed' && '⚙️'}
                  {tab === 'box' && '📦'}
                </span>
                <span>{tab}</span>
              </motion.button>
            ))}
          </motion.div>

          {/* Content */}
          <div className="overflow-y-auto max-h-96">
            <AnimatePresence mode="wait">
              {activeTab === 'styles' && (
                <motion.div
                  key="styles"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="p-4"
                >
                  {/* Search */}
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Search styles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-bolt-elements-borderColorActive focus:border-bolt-elements-borderColorActive text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary"
                    />
                  </div>
                  
                  {/* Style Categories */}
                  <div className="space-y-3">
                    {Object.entries(getStylesByCategory(selectedElement.styles)).map(([categoryKey, category]) => {
                      const isExpanded = expandedSections.has(categoryKey);
                      const filteredCategoryStyles = filteredStyles(category.styles);
                      
                      if (Object.keys(filteredCategoryStyles).length === 0) return null;
                      
                      return (
                        <motion.div
                          key={categoryKey}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border border-bolt-elements-borderColor rounded-lg overflow-hidden shadow-sm"
                        >
                          <motion.button
                            onClick={() => toggleSection(categoryKey)}
                            className="w-full flex items-center justify-between p-3 bg-bolt-elements-background-depth-1 hover:bg-bolt-elements-item-backgroundActive transition-all duration-200 cursor-pointer"
                            whileHover={{ 
                              backgroundColor: "var(--bolt-elements-item-backgroundActive)",
                              scale: 1.01
                            }}
                            whileTap={{ scale: 0.99 }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs transform hover:scale-110 transition-transform">{category.icon}</span>
                              <span className="font-medium text-bolt-elements-textPrimary text-sm">{category.title}</span>
                              <span className="text-xs text-bolt-elements-textTertiary bg-bolt-elements-background-depth-2 px-2 py-0.5 rounded-full border border-bolt-elements-borderColor">
                                {Object.keys(filteredCategoryStyles).length}
                              </span>
                            </div>
                            <motion.div
                              animate={{ 
                                rotate: isExpanded ? 90 : 0,
                                scale: isExpanded ? 1.1 : 1
                              }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronRightIcon className="w-4 h-4 text-bolt-elements-textSecondary" />
                            </motion.div>
                          </motion.button>
                          
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                <div className="p-3 space-y-1 bg-bolt-elements-background-depth-2">
                                  {Object.entries(filteredCategoryStyles).map(([prop, value]) => (
                                    <motion.div
                                      key={prop}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      className="flex items-center justify-between text-sm group hover:bg-bolt-elements-item-backgroundActive p-2 rounded-md transition-all duration-200 hover:shadow-sm"
                                      whileHover={{ scale: 1.01 }}
                                    >
                                      <span className="text-bolt-elements-textSecondary font-medium">{prop}:</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-bolt-elements-textPrimary font-mono text-xs bg-bolt-elements-background-depth-1 px-2 py-1 rounded-md border border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive transition-colors">
                                          {value}
                                        </span>
                                        <motion.button
                                          onClick={() => copyToClipboard(`${prop}: ${value}`)}
                                          className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 hover:bg-bolt-elements-item-backgroundActive rounded-full"
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                        >
                                          <ClipboardIcon className="w-3 h-3 text-bolt-elements-textSecondary" />
                                        </motion.button>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {activeTab === 'box' && (
                <motion.div
                  key="box"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="p-4"
                >
                  {/* Box Model Visualization */}
                  <div className="mb-3 p-3 bg-bolt-elements-background-depth-1 rounded-lg border border-bolt-elements-borderColor">
                    <h4 className="text-sm font-medium text-bolt-elements-textPrimary mb-3 flex items-center gap-2">
                      📦 Box Model
                    </h4>
                    <div className="space-y-2">
                      {[
                        { label: 'Width', value: selectedElement.rect.width },
                        { label: 'Height', value: selectedElement.rect.height },
                        { label: 'Top', value: selectedElement.rect.top },
                        { label: 'Left', value: selectedElement.rect.left },
                      ].map((item, index) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-2 bg-bolt-elements-background-depth-2 rounded border border-bolt-elements-borderColor group hover:bg-bolt-elements-item-backgroundActive transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-bolt-elements-textSecondary font-medium text-sm">{item.label}:</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-bolt-elements-textPrimary font-mono bg-bolt-elements-background-depth-1 px-2 py-1 rounded text-xs border border-bolt-elements-borderColor">
                              {Math.round(item.value)}px
                            </span>
                            <motion.button
                              onClick={() => copyToClipboard(`${Math.round(item.value)}px`)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-bolt-elements-item-backgroundActive rounded transition-all"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <ClipboardIcon className="w-3 h-3 text-bolt-elements-textSecondary" />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'computed' && (
                <motion.div
                  key="computed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="p-4"
                >
                  <div className="text-center py-8 text-bolt-elements-textSecondary">
                    <div className="text-4xl mb-2">⚙️</div>
                    <p className="text-sm">Computed styles coming soon...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};