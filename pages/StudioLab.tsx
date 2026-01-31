
import React, { useState, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import ApiKeySelection from '../components/ApiKeySelection';

const StudioLab: React.FC = () => {
  const [hasKey, setHasKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'edit' | 'analyze'>('generate');
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{ text: string | undefined, sources?: any[] } | null>(null);
  const [logs, setLogs] = useState<string[]>(["SYSTEM_IDLE: Awaiting input signal..."]);
  
  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-4), `> ${msg}`]);

  // Generation State
  const [genPrompt, setGenPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState('1K');

  // Edit/Analyze State
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      addLog(`ASSET_LOADED: ${file.name}`);
      const reader = new FileReader();
      reader.onloadend = () => setSelectedFile(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResultImage(null);
    addLog(`INIT_GENERATION: Prompt received...`);
    addLog(`MODEL_SYNC: Handshaking with Gemini 3 Pro...`);
    try {
      const img = await geminiService.generateImage(genPrompt, { aspectRatio, imageSize });
      setResultImage(img);
      addLog(`PROCESS_COMPLETE: Reconstruction successful.`);
    } catch (err: any) {
      addLog(`ERROR: Protocol failure. ${err.message}`);
      if (err.message?.includes("Requested entity was not found")) {
         setHasKey(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedFile) return;
    setLoading(true);
    addLog(`INIT_SURGERY: Analyzing base mesh...`);
    try {
      const img = await geminiService.editImage(selectedFile, editPrompt);
      setResultImage(img);
      addLog(`PROCESS_COMPLETE: Object modified.`);
    } catch (err) {
      addLog(`ERROR: Surgery failed.`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setAnalysis(null);
    addLog(`INIT_VISION: Running diagnostic scan...`);
    try {
      const text = await geminiService.analyzeImage(selectedFile);
      setAnalysis({ text: text || "Diagnostic scan returned no textual data." });
      addLog(`PROCESS_COMPLETE: Diagnostics available.`);
    } catch (err) {
      addLog(`ERROR: Scan interrupted.`);
    } finally {
      setLoading(false);
    }
  };

  const handleTrendSearch = async () => {
    setLoading(true);
    addLog(`INIT_SEARCH: Accessing global data nodes...`);
    try {
      const data = await geminiService.getTrends(genPrompt || "streetwear 2024");
      setAnalysis({
        text: data.text || "No trend data found.",
        sources: data.sources
      });
      addLog(`PROCESS_COMPLETE: Grounding sources found.`);
    } catch (err) {
      addLog(`ERROR: Data fetch failed.`);
    } finally {
      setLoading(false);
    }
  };

  if (!hasKey) {
    return (
      <div className="min-h-screen pt-48 px-6">
        <ApiKeySelection onSuccess={() => setHasKey(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-48 px-6 max-w-7xl mx-auto">
      <div className="mb-16 border-l-4 border-fuchsia-studio pl-8">
        <h1 className="text-6xl font-black uppercase tracking-tighter italic">Studio Lab</h1>
        <p className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] mt-2 font-bold">
          Neural Design Terminal & Object Reconstruction
        </p>
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
        {/* Left: Controls */}
        <div className="space-y-8">
          {activeTab === 'generate' && (
            <div className="space-y-6 bg-zinc-900/50 p-8 border border-zinc-800 stitch-corner">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Design Prompt</label>
                <textarea 
                  className="w-full bg-black border border-zinc-800 p-4 text-[11px] font-mono focus:border-fuchsia-studio outline-none transition-colors h-32"
                  value={genPrompt}
                  onChange={e => setGenPrompt(e.target.value)}
                  placeholder="E.g. Oversized hoodie with industrial stitching, charcoal texture, fuchsia accents, high-fashion photography..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Aspect Ratio</label>
                  <select 
                    className="w-full bg-black border border-zinc-800 p-3 text-[10px] uppercase font-black"
                    value={aspectRatio}
                    onChange={e => setAspectRatio(e.target.value)}
                  >
                    {['1:1', '3:4', '4:3', '9:16', '16:9'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Resolution</label>
                  <select 
                    className="w-full bg-black border border-zinc-800 p-3 text-[10px] uppercase font-black"
                    value={imageSize}
                    onChange={e => setImageSize(e.target.value)}
                  >
                    {['1K', '2K', '4K'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex-1 bg-white text-black py-4 font-black uppercase tracking-[0.3em] text-[10px] hover:bg-fuchsia-studio hover:text-white transition-all disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Generate Design'}
                </button>
                <button 
                  onClick={handleTrendSearch}
                  disabled={loading}
                  className="px-6 border border-zinc-800 text-[10px] font-black uppercase tracking-widest hover:border-fuchsia-studio transition-all"
                  title="Trend Analysis via Google Search"
                >
                  Trends
                </button>
              </div>
            </div>
          )}

          {(activeTab === 'edit' || activeTab === 'analyze') && (
            <div className="space-y-6 bg-zinc-900/50 p-8 border border-zinc-800 stitch-corner">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center cursor-pointer hover:border-fuchsia-studio transition-colors overflow-hidden group"
              >
                {selectedFile ? (
                  <img src={selectedFile} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                ) : (
                  <>
                    <span className="text-3xl font-black text-zinc-800">×</span>
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-2">Upload Visual Asset</span>
                  </>
                )}
                <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
              </div>

              {activeTab === 'edit' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Surgery Instructions</label>
                    <input 
                      type="text"
                      className="w-full bg-black border border-zinc-800 p-4 text-[11px] font-mono focus:border-fuchsia-studio outline-none transition-colors"
                      value={editPrompt}
                      onChange={e => setEditPrompt(e.target.value)}
                      placeholder="e.g. Add a retro filter and remove person from background"
                    />
                  </div>
                  <button 
                    onClick={handleEdit}
                    disabled={loading || !selectedFile}
                    className="w-full bg-white text-black py-4 font-black uppercase tracking-[0.3em] text-[10px] hover:bg-fuchsia-studio hover:text-white transition-all disabled:opacity-50"
                  >
                    Execute Surgery
                  </button>
                </div>
              )}

              {activeTab === 'analyze' && (
                <button 
                  onClick={handleAnalyze}
                  disabled={loading || !selectedFile}
                  className="w-full bg-white text-black py-4 font-black uppercase tracking-[0.3em] text-[10px] hover:bg-fuchsia-studio hover:text-white transition-all disabled:opacity-50"
                >
                  Run Vision Diagnostics
                </button>
              )}
            </div>
          )}

          {/* Terminal Logs */}
          <div className="bg-black border border-zinc-900 p-6 font-mono text-[9px] text-zinc-500 space-y-2 uppercase tracking-widest">
            {logs.map((log, i) => (
              <div key={i} className={i === logs.length - 1 ? 'text-fuchsia-studio' : ''}>{log}</div>
            ))}
          </div>
        </div>

        {/* Right: Output */}
        <div className="space-y-8">
          <div className="bg-zinc-900 border border-zinc-800 min-h-[400px] flex flex-col relative overflow-hidden">
             {loading && (
               <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-12 h-12 border-2 border-fuchsia-studio border-t-transparent animate-spin mb-6" />
                  <p className="text-fuchsia-studio text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Syncing with Neural Network...</p>
                  <p className="text-zinc-600 text-[8px] uppercase tracking-[0.2em] mt-4 max-w-xs">Initializing high-fidelity reconstruction protocols. Stand by.</p>
               </div>
             )}

             <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-black/50">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Output Terminal</span>
                <div className="flex gap-2">
                   <div className="w-2 h-2 rounded-full bg-zinc-800" />
                   <div className="w-2 h-2 rounded-full bg-zinc-800" />
                   <div className="w-2 h-2 rounded-full bg-fuchsia-studio animate-pulse" />
                </div>
             </div>

             <div className="flex-1 p-8 flex items-center justify-center">
                {resultImage ? (
                  <img src={resultImage} className="max-w-full h-auto shadow-2xl" />
                ) : analysis ? (
                  <div className="w-full space-y-6">
                    <div className="bg-black/50 p-6 border-l-2 border-fuchsia-studio">
                      <p className="text-[11px] text-zinc-400 font-mono leading-loose whitespace-pre-wrap">{analysis.text}</p>
                    </div>
                    {analysis.sources && analysis.sources.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Data Grounding Links:</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.sources.map((s: any, i: number) => (
                            <a 
                              key={i} 
                              href={s.uri} 
                              target="_blank" 
                              className="text-[9px] bg-zinc-800 px-3 py-1 hover:bg-fuchsia-studio transition-colors font-bold uppercase"
                            >
                              {s.title || 'Source'}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <span className="text-4xl font-black text-zinc-900">ARCHIVE_VOID</span>
                    <p className="text-[9px] text-zinc-700 uppercase tracking-widest font-bold">Awaiting Input Signal</p>
                  </div>
                )}
             </div>
          </div>

          <div className="p-6 border border-zinc-900 bg-zinc-900/10">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4 italic">Neural Core Specs</h4>
            <div className="grid grid-cols-2 gap-4 text-[8px] text-zinc-700 uppercase font-black tracking-widest">
              <div>Model: Gemini 3 Series</div>
              <div>Grounding: Google Search Active</div>
              <div>Buffer: 2048 Tokens</div>
              <div>Modality: Multimodal Optic</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudioLab;
