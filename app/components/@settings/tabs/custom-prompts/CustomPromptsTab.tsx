import { useEffect, useState } from 'react';
import { Button } from '~/components/ui/Button';
import { useSettings } from '~/lib/hooks/useSettings';
import { toast } from 'react-toastify';

export default function CustomPromptsTab() {
  const { customPrompt, setCustomPrompt, promptId, setPromptId } = useSettings();
  const [value, setValue] = useState('');

  useEffect(() => {
    setValue(customPrompt);
  }, [customPrompt]);

  const handleSave = () => {
    setCustomPrompt(value);
    toast.success('Custom prompt saved');
  };

  const activatePrompt = () => {
    setPromptId('custom');
    toast.success('Custom prompt activated');
  };

  return (
    <div className="flex flex-col gap-4">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full min-h-[200px] p-2 rounded-lg bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor text-bolt-elements-textPrimary"
        placeholder="Enter custom prompt"
      />
      <div className="flex gap-2">
        <Button onClick={handleSave} className="bg-purple-500 hover:bg-purple-600 text-white">
          Save
        </Button>
        <Button onClick={activatePrompt} className="bg-purple-500 hover:bg-purple-600 text-white" disabled={promptId === 'custom'}>
          {promptId === 'custom' ? 'Active' : 'Use Prompt'}
        </Button>
      </div>
    </div>
  );
}
