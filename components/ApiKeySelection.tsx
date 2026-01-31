
import React, { useState, useEffect } from 'react';

// The aistudio object is provided globally by the environment as an AIStudio type.
// We remove the conflicting local declaration and use type-safe access via casting.

interface ApiKeySelectionProps {
  onSuccess: () => void;
}

const ApiKeySelection: React.FC<ApiKeySelectionProps> = ({ onSuccess }) => {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    try {
      // Use type casting to access the globally injected aistudio object and check for an existing key.
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (hasKey) {
        onSuccess();
      }
    } catch (err) {
      console.error("Key check failed", err);
    } finally {
      setChecking(false);
    }
  };

  const handleSelectKey = async () => {
    try {
      // Trigger the environment's key selection dialog.
      await (window as any).aistudio.openSelectKey();
      // Assume success and proceed to mitigate potential race conditions as per documentation.
      onSuccess();
    } catch (err) {
      alert("Key selection failed. Please try again.");
    }
  };

  if (checking) return null;

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-zinc-900 border border-zinc-800 stitch-corner text-center space-y-8 max-w-xl mx-auto">
      <div className="w-16 h-16 bg-fuchsia-studio/10 flex items-center justify-center rounded-none border border-fuchsia-studio/30 transform rotate-45">
        <span className="text-fuchsia-studio font-black text-2xl transform -rotate-45">!</span>
      </div>
      <div className="space-y-4">
        <h2 className="text-3xl font-black uppercase tracking-tighter italic">Neural Link Required</h2>
        <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] leading-relaxed">
          High-fidelity reconstruction via <span className="text-white">Gemini 3 Pro</span> requires a dedicated API key from a paid GCP project.
        </p>
      </div>
      <div className="bg-black p-4 border border-zinc-800 text-left">
        <p className="text-[8px] text-zinc-600 uppercase tracking-widest leading-loose">
          Important: Ensure your key is from a project with <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-fuchsia-studio underline" rel="noopener noreferrer">billing enabled</a> to access the full Studio Lab suite.
        </p>
      </div>
      <button 
        onClick={handleSelectKey}
        className="w-full bg-white text-black py-5 font-black uppercase tracking-[0.4em] text-[10px] hover:bg-fuchsia-studio hover:text-white transition-all"
      >
        Establish Connection
      </button>
    </div>
  );
};

export default ApiKeySelection;
