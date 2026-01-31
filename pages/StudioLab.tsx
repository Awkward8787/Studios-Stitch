
import React, { useState, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import ApiKeySelection from '../components/ApiKeySelection';

interface AnalysisState {
  text: string;
  sources?: { title: string; uri: string }[];
}

const StudioLab: React.FC = () => {
  const [hasKey, setHasKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'edit' | 'analyze'>('generate');
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
  const [logs, setLogs] = useState<string[]>(["SYSTEM_IDLE: Awaiting input signal..."]);
  
  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-4), `> ${msg}`]);

  const [genPrompt, setGenPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState('1K');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedFile(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!genPrompt) return;
    setLoading(true);
    setResultImage(null);
    try {
      const img = await geminiService.generateImage(genPrompt, { aspectRatio, imageSize });
      setResultImage(img);
      addLog("SUCCESS: Reconstruction complete.");
    } catch (err: any) {
      addLog(`ERROR: ${err.message}`);
      if (err.message?.includes("403") || err.message?.includes("401")) setHasKey(false);
    } finally {
      setLoading(false);
    }
  };

  const handleTrendSearch = async () => {
    setLoading(true);
    try {
      const data = await geminiService.getTrends(genPrompt || "streetwear");
      setAnalysis({ text: data.text, sources: data.sources });
      addLog("SUCCESS: Grounding complete.");
    } catch (err: any) {
      addLog(`ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedFile || !editPrompt) return;
    setLoading(true);
    try {
      const img = await geminiService.editImage(selectedFile, editPrompt);
      setResultImage(img);
      addLog("SUCCESS: Surgery complete.");
    } catch (err: any) {
      addLog(`ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setLoading(true);
    try {
      const text = await geminiService.analyzeImage(selectedFile);
      setAnalysis({ text: text || "No data." });
      addLog("SUCCESS: Scan complete.");
    } catch (err: any) {
      addLog(`ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!hasKey) return <div className="pt-48"><ApiKeySelection onSuccess={() => setHasKey(true)} /></div>;

  return (
    <div className="min-h-screen pt-24 pb-48 px-6 max-w-7xl mx-auto">
      <div className="mb-16 border-l-4 border-fuchsia-studio pl-8">
        <h1 className="text-6xl font-black uppercase tracking-tighter italic">Studio Lab</h1>
        <p className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] mt-2 font-bold">Neural Design Terminal</p>
      </div>

      <div className="flex gap-4 mb-12 border-b border-zinc-900 pb-4">
        {(['generate', 'edit', 'analyze'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setResultImage(null); setAnalysis(null); }}
            className={`text-[10px] font-black uppercase tracking-[0.3em] px-8 py-3 transition-all ${activeTab === tab ? 'bg-fuchsia-studio text-white' : 'text-zinc-600 hover:text-white'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-8">
          {activeTab === 'generate' && (
            <div className="space-y-6 bg-zinc-900/50 p-8 border border-zinc-800 stitch-corner">
              <textarea 
                className="w-full bg-black border border-zinc-800 p-4 text-[11px] font-mono focus:border-fuchsia-studio outline-none h-32"
                value={genPrompt}
                onChange={e => setGenPrompt(e.target.value)}
                placeholder="Describe your design..."
              />
              <div className="grid grid-cols-2 gap-4">
                <select className="bg-black border border-zinc-800 p-3 text-[10px] font-black" value={aspectRatio} onChange={e => setAspectRatio(e.target.value)}>
                  {['1:1', '3:4', '4:3', '9:16', '16:9'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select className="bg-black border border-zinc-800 p-3 text-[10px] font-black" value={imageSize} onChange={e => setImageSize(e.target.value)}>
                  {['1K', '2K', '4K'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-4">
                <button onClick={handleGenerate} disabled={loading} className="flex-1 bg-white text-black py-4 font-black uppercase text-[10px] hover:bg-fuchsia-studio hover:text-white disabled:opacity-50">Generate</button>
                <button onClick={handleTrendSearch} disabled={loading} className="px-6 border border-zinc-800 text-[10px] font-black uppercase hover:border-fuchsia-studio">Trends</button>
              </div>
            </div>
          )}

          {(activeTab === 'edit' || activeTab === 'analyze') && (
            <div className="space-y-6 bg-zinc-900/50 p-8 border border-zinc-800 stitch-corner">
              <div onClick={() => fileInputRef.current?.click()} className="aspect-video border-2 border-dashed border-zinc-800 flex items-center justify-center cursor-pointer overflow-hidden">
                {selectedFile ? <img src={selectedFile} className="w-full h-full object-contain" /> : <span className="text-[10px] font-black text-zinc-600 uppercase">Upload Asset</span>}
                <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
              </div>
              {activeTab === 'edit' && (
                <div className="space-y-4">
                  <input type="text" className="w-full bg-black border border-zinc-800 p-4 text-[11px] font-mono" value={editPrompt} onChange={e => setEditPrompt(e.target.value)} placeholder="Edit instruction..." />
                  <button onClick={handleEdit} disabled={loading} className="w-full bg-white text-black py-4 font-black uppercase text-[10px] hover:bg-fuchsia-studio hover:text-white">Execute Surgery</button>
                </div>
              )}
              {activeTab === 'analyze' && (
                <button onClick={handleAnalyze} disabled={loading} className="w-full bg-white text-black py-4 font-black uppercase text-[10px] hover:bg-fuchsia-studio hover:text-white">Run Diagnostic</button>
              )}
            </div>
          )}

          <div className="bg-black border border-zinc-900 p-6 font-mono text-[9px] text-zinc-500 space-y-2 uppercase">
            {logs.map((log, i) => (
              <div key={i} className={i === logs.length - 1 ? 'text-fuchsia-studio' : ''}>{log}</div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-zinc-900 border border-zinc-800 min-h-[400px] flex flex-col relative overflow-hidden">
             {loading && <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center text-fuchsia-studio text-[10px] font-black uppercase animate-pulse">Neural Sync in Progress...</div>}
             <div className="flex-1 p-8 flex items-center justify-center">
                {resultImage ? <img src={resultImage} className="max-w-full h-auto" /> : analysis ? (
                  <div className="w-full space-y-6">
                    <p className="text-[11px] text-zinc-400 font-mono leading-loose">{analysis.text}</p>
                    {analysis.sources && (
                      <div className="flex flex-wrap gap-2">
                        {analysis.sources.map((s, i) => <a key={i} href={s.uri} target="_blank" className="text-[9px] bg-zinc-800 px-3 py-1 hover:bg-fuchsia-studio font-bold uppercase">{s.title}</a>)}
                      </div>
                    )}
                  </div>
                ) : <span className="text-4xl font-black text-zinc-900">VOID</span>}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudioLab;
