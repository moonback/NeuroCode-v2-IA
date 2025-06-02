import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InspectorProps {
  isActive: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  onElementSelect: (elementInfo: ElementInfo) => void;
}

export interface ElementInfo {
  displayText: string;
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

export const Inspector = ({ isActive, iframeRef, onElementSelect }: InspectorProps) => {
  const [hoveredElement, setHoveredElement] = useState<ElementInfo | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !iframeRef.current) {
      return undefined;
    }

    const iframe = iframeRef.current;

    // Listen for messages from the iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'INSPECTOR_HOVER') {
        const elementInfo = event.data.elementInfo;

        // Adjust coordinates relative to iframe position
        const iframeRect = iframe.getBoundingClientRect();
        elementInfo.rect.x += iframeRect.x;
        elementInfo.rect.y += iframeRect.y;
        elementInfo.rect.top += iframeRect.y;
        elementInfo.rect.left += iframeRect.x;

        setHoveredElement(elementInfo);
      } else if (event.data.type === 'INSPECTOR_CLICK') {
        const elementInfo = event.data.elementInfo;

        // Adjust coordinates relative to iframe position
        const iframeRect = iframe.getBoundingClientRect();
        elementInfo.rect.x += iframeRect.x;
        elementInfo.rect.y += iframeRect.y;
        elementInfo.rect.top += iframeRect.y;
        elementInfo.rect.left += iframeRect.x;

        onElementSelect(elementInfo);
      } else if (event.data.type === 'INSPECTOR_LEAVE') {
        setHoveredElement(null);
      }
    };

    window.addEventListener('message', handleMessage);

    // Send activation message to iframe
    const sendActivationMessage = () => {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: 'INSPECTOR_ACTIVATE',
            active: isActive,
          },
          '*',
        );
      }
    };

    // Try to send activation message immediately and on load
    sendActivationMessage();
    iframe.addEventListener('load', sendActivationMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      iframe.removeEventListener('load', sendActivationMessage);

      // Deactivate inspector in iframe
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: 'INSPECTOR_ACTIVATE',
            active: false,
          },
          '*',
        );
      }
    };
  }, [isActive, iframeRef, onElementSelect]);

  // Render overlay for hovered element
  return (
    <AnimatePresence>
      {isActive && hoveredElement && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="fixed pointer-events-none z-50"
          style={{
            left: hoveredElement.rect.x,
            top: hoveredElement.rect.y,
            width: hoveredElement.rect.width,
            height: hoveredElement.rect.height,
          }}
        >
          {/* Animated border overlay */}
          <motion.div
            className="absolute inset-0 border-2 border-blue-500 bg-blue-500/10 rounded-sm"
            initial={{ borderColor: "rgb(59 130 246)", backgroundColor: "rgb(59 130 246 / 0.1)" }}
            animate={{
              borderColor: ["rgb(59 130 246)", "rgb(99 102 241)", "rgb(59 130 246)"],
              backgroundColor: ["rgb(59 130 246 / 0.1)", "rgb(99 102 241 / 0.15)", "rgb(59 130 246 / 0.1)"]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Enhanced tooltip */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.2 }}
            className="absolute -top-10 left-0 bg-gray-900/95 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-md shadow-lg border border-gray-700 whitespace-nowrap"
          >
            <div className="flex items-center gap-2">
              <span className="text-blue-300 font-mono">
                {hoveredElement.tagName.toLowerCase()}
              </span>
              {hoveredElement.id && (
                <span className="text-green-300 font-mono">#{hoveredElement.id}</span>
              )}
              {hoveredElement.className && (
                <span className="text-yellow-300 font-mono">
                  .{hoveredElement.className.split(' ')[0]}
                </span>
              )}
            </div>
            {hoveredElement.textContent && (
              <div className="text-gray-300 text-xs mt-1 max-w-48 truncate">
                "{hoveredElement.textContent}"
              </div>
            )}
            <div className="text-gray-400 text-xs mt-1">
              {Math.round(hoveredElement.rect.width)}×{Math.round(hoveredElement.rect.height)}
            </div>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};