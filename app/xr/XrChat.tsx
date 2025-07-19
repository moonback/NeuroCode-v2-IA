import React from 'react';
import { XrCanvas } from './XrCanvas';
import { XrAssistant } from './XrAssistant';
import { Html } from '@react-three/drei';
import { Chat } from '~/components/chat/Chat.client';

interface XrChatProps {
  activeResponse: boolean;
}

export const XrChat: React.FC<XrChatProps> = ({ activeResponse }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black">
      <XrCanvas>
        <ambientLight />
        <XrAssistant active={activeResponse} />
        <Html position={[0, 1.2, -1]}> 
          <div className="w-[300px] h-[400px] overflow-auto bg-white/80 rounded-lg">
            <Chat />
          </div>
        </Html>
      </XrCanvas>
    </div>
  );
};
