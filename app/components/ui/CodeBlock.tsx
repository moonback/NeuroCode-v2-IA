import React, { useState, useEffect, memo } from 'react';
import { classNames } from '~/utils/classNames';
import { motion } from 'framer-motion';
import { FileIcon } from './FileIcon';
import { Tooltip } from './Tooltip';
import { bundledLanguages, codeToHtml, isSpecialLang, type BundledLanguage, type SpecialLanguage } from 'shiki';
import { createScopedLogger } from '~/utils/logger';

import styles from './CodeBlock.module.scss';

const logger = createScopedLogger('CodeBlock');

interface CodeBlockProps {
  code: string;
  language?: string | BundledLanguage | SpecialLanguage;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  maxHeight?: string;
  className?: string;
  onCopy?: () => void;
  theme?: 'light-plus' | 'dark-plus';
  useShiki?: boolean;
  disableCopy?: boolean;
}

const UnmemoizedCodeBlock = ({
  code,
  language = 'plaintext',
  filename,
  showLineNumbers = true,
  highlightLines = [],
  maxHeight = '400px',
  className,
  onCopy,
  theme = 'dark-plus',
  useShiki = false,
  disableCopy = false,
}: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const [html, setHTML] = useState<string | undefined>(undefined);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  const lines = code.split('\n');

  // Shiki syntax highlighting
  useEffect(() => {
    if (!useShiki) return;

    let effectiveLanguage = language as BundledLanguage | SpecialLanguage;

    if (language && !isSpecialLang(effectiveLanguage) && !(effectiveLanguage in bundledLanguages)) {
      logger.warn(`Unsupported language '${language}', falling back to plaintext`);
      effectiveLanguage = 'plaintext';
    }

    logger.trace(`Language = ${effectiveLanguage}`);

    const processCode = async () => {
      setHTML(await codeToHtml(code, { lang: effectiveLanguage, theme }));
    };

    processCode();
  }, [code, language, theme, useShiki]);

  // Render based on whether we're using Shiki or not
  if (useShiki && html) {
    return (
      <div className={classNames('relative group text-left', className)}>
        <div
          className={classNames(
            styles.CopyButtonContainer,
            'bg-transparant absolute top-[10px] right-[10px] rounded-md z-10 text-lg flex items-center justify-center opacity-0 group-hover:opacity-100',
            {
              'rounded-l-0 opacity-100': copied,
            },
          )}
        >
          {!disableCopy && (
            <button
              className={classNames(
                'flex items-center bg-accent-500 p-[6px] justify-center before:bg-white before:rounded-l-md before:text-gray-500 before:border-r before:border-gray-300 rounded-md transition-theme',
                {
                  'before:opacity-0': !copied,
                  'before:opacity-100': copied,
                },
              )}
              title="Copy Code"
              onClick={handleCopy}
            >
              <div className="i-ph:clipboard-text-duotone"></div>
            </button>
          )}
        </div>
        <div dangerouslySetInnerHTML={{ __html: html ?? '' }}></div>
      </div>
    );
  }

  // Standard rendering with line numbers
  return (
    <div
      className={classNames(
        'rounded-lg overflow-hidden border border-bolt-elements-borderColor dark:border-bolt-elements-borderColor-dark',
        'bg-bolt-elements-background-depth-2 dark:bg-bolt-elements-background-depth-3',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-bolt-elements-background-depth-3 dark:bg-bolt-elements-background-depth-4 border-b border-bolt-elements-borderColor dark:border-bolt-elements-borderColor-dark">
        <div className="flex items-center gap-2">
          {filename && (
            <>
              <FileIcon filename={filename} size="sm" />
              <span className="text-xs font-medium text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary-dark">
                {filename}
              </span>
            </>
          )}
          {language && !filename && (
            <span className="text-xs font-medium text-bolt-elements-textSecondary dark:text-bolt-elements-textSecondary-dark uppercase">
              {typeof language === 'string' ? language : String(language)}
            </span>
          )}
        </div>
        {!disableCopy && (
          <Tooltip content={copied ? 'Copied!' : 'Copy code'}>
            <motion.button
              onClick={handleCopy}
              className="p-1.5 rounded-md text-bolt-elements-textTertiary hover:text-bolt-elements-textSecondary dark:text-bolt-elements-textTertiary-dark dark:hover:text-bolt-elements-textSecondary-dark hover:bg-bolt-elements-background-depth-2 dark:hover:bg-bolt-elements-background-depth-3 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {copied ? <span className="i-ph:check w-4 h-4 text-green-500" /> : <span className="i-ph:copy w-4 h-4" />}
            </motion.button>
          </Tooltip>
        )}
      </div>

      {/* Code content */}
      <div className={classNames('overflow-auto', 'font-mono text-sm', 'custom-scrollbar')} style={{ maxHeight }}>
        <table className="min-w-full border-collapse">
          <tbody>
            {lines.map((line, index) => (
              <tr
                key={index}
                className={classNames(
                  highlightLines.includes(index + 1) ? 'bg-purple-500/10 dark:bg-purple-500/20' : '',
                  'hover:bg-bolt-elements-background-depth-3 dark:hover:bg-bolt-elements-background-depth-4',
                )}
              >
                {showLineNumbers && (
                  <td className="py-1 pl-4 pr-2 text-right select-none text-bolt-elements-textTertiary dark:text-bolt-elements-textTertiary-dark border-r border-bolt-elements-borderColor dark:border-bolt-elements-borderColor-dark">
                    <span className="inline-block min-w-[1.5rem] text-xs">{index + 1}</span>
                  </td>
                )}
                <td className="py-1 pl-4 pr-4 text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary-dark whitespace-pre">
                  {line || ' '}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Export both memoized and unmemoized versions
export const CodeBlock = memo(UnmemoizedCodeBlock);
