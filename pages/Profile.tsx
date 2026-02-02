
import React, { useState, useEffect } from 'react';
import { User, Product, Order, Folder, FileDoc, Note, TeamMember } from '../types';
import { supabaseService } from '../services/supabaseService';
import { printfulService } from '../services/printfulService';
import { firebaseService } from '../services/firebaseService';
import ProductCard from '../components/ProductCard';
import Modal from '../components/Modal';

interface ProfileProps {
  user: User;
}

type Tab = 'overview' | 'files' | 'notes' | 'team';

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  // Overview Data
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // New Dashboard Data
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileDoc[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [modals, setModals] = useState({
    folder: false,
    file: false,
    note: false,
    member: false
  });

  // Form States
  const [folderName, setFolderName] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');

  // Initial Load
  useEffect(() => {
    loadTabContent();
  }, [activeTab, user.id, currentFolderId]);

  const loadTabContent = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const [wishlist, userOrders] = await Promise.all([
          supabaseService.getWishlist(user.id),
          supabaseService.getUserOrders(user.id)
        ]);
        const productPromises = wishlist.map(item => printfulService.getProduct(item.product_id));
        const products = await Promise.all(productPromises);
        setWishlistProducts(products.filter((p): p is Product => p !== null));
        setOrders(userOrders);
      } 
      else if (activeTab === 'files') {
        const [fetchedFolders, fetchedFiles] = await Promise.all([
          firebaseService.getFolders(user.id),
          firebaseService.getFiles(user.id, currentFolderId)
        ]);
        setFolders(fetchedFolders);
        setFiles(fetchedFiles);
      } 
      else if (activeTab === 'notes') {
        const fetchedNotes = await firebaseService.getNotes(user.id);
        setNotes(fetchedNotes);
      } 
      else if (activeTab === 'team') {
        const fetchedMembers = await firebaseService.getTeamMembers(user.id);
        setTeamMembers(fetchedMembers);
      }
    } catch (err) {
      console.error("DASHBOARD_FETCH_ERROR", err);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    await firebaseService.createFolder(user.id, folderName);
    setFolderName('');
    setModals(m => ({ ...m, folder: false }));
    loadTabContent();
    setActionLoading(false);
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    await firebaseService.createFile(user.id, fileName, fileSize, currentFolderId);
    setFileName('');
    setFileSize('');
    setModals(m => ({ ...m, file: false }));
    loadTabContent();
    setActionLoading(false);
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    await firebaseService.createNote(user.id, noteTitle, noteContent);
    setNoteTitle('');
    setNoteContent('');
    setModals(m => ({ ...m, note: false }));
    loadTabContent();
    setActionLoading(false);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    await firebaseService.addTeamMember(user.id, memberName, memberRole);
    setMemberName('');
    setMemberRole('');
    setModals(m => ({ ...m, member: false }));
    loadTabContent();
    setActionLoading(false);
  };

  // --- RENDERERS ---

  if (loading && !actionLoading && activeTab === 'overview') {
    return (
      <div className="pt-48 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-12 h-12 border-2 border-zinc-900 border-t-fuchsia-studio rounded-full animate-spin mb-8" />
        <p className="text-[10px] uppercase font-black tracking-[0.5em] text-zinc-500">Decrypting User Manifest...</p>
      </div>
    );
  }

  return (
    <div className="pt-32 px-6 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
        <div className="space-y-4">
           <div className="inline-block bg-fuchsia-studio px-2 py-1 text-[8px] font-black uppercase tracking-[0.4em] text-white mb-2">Security Level: Authorized</div>
           <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none italic">{user.email.split('@')[0]}</h1>
           <p className="text-zinc-500 text-xs uppercase tracking-[0.3em] font-black">{user.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-900/50 border-b border-zinc-800 mb-12 overflow-x-auto">
        {(['overview', 'files', 'notes', 'team'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-5 text-[10px] uppercase font-black tracking-[0.2em] transition-all border-b-2 ${
              activeTab === tab 
                ? 'border-fuchsia-studio text-white bg-zinc-900' 
                : 'border-transparent text-zinc-500 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            My {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in duration-500 pb-24">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-16">
            <div className="flex items-center gap-6">
               <h2 className="text-2xl font-black uppercase tracking-tighter italic">Reserved Manifest</h2>
               <div className="h-[1px] flex-1 bg-zinc-900" />
            </div>

            {wishlistProducts.length === 0 ? (
              <div className="py-20 text-center border border-zinc-900 bg-zinc-900/10 stitch-corner">
                <span className="text-zinc-800 text-6xl font-black italic block mb-6">×</span>
                <p className="text-zinc-500 uppercase tracking-[0.3em] text-[10px] font-black">Manifest Empty. No assets prioritized.</p>
                <a href="#/shop" className="inline-block mt-8 bg-white text-black px-12 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-fuchsia-studio hover:text-white transition-all">Search Inventory</a>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {wishlistProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            <div className="mt-32 border-t border-zinc-900 pt-16">
               <div className="flex items-center gap-6 mb-12">
                 <h2 className="text-2xl font-black uppercase tracking-tighter italic">Acquisition History</h2>
                 <div className="h-[1px] flex-1 bg-zinc-900" />
              </div>
              
              {orders.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-zinc-800">
                   <p className="text-zinc-700 uppercase tracking-[0.4em] text-[9px] font-black">Global Log Interface: No completed transactions found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="bg-zinc-900/40 border border-zinc-800 p-6 flex flex-col md:flex-row justify-between items-center gap-6 stitch-corner">
                      <div className="flex items-center gap-6">
                        <div className="flex -space-x-4">
                          {order.items.slice(0, 3).map((item, i) => (
                            <img key={i} src={item.thumbnail_url} className="w-12 h-16 object-cover border-2 border-black rounded-sm" />
                          ))}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Order Ref: {order.id.slice(0, 8)}</p>
                          <p className="text-xs font-black text-white uppercase mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className="text-xl font-black text-white italic">${order.total.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FILES TAB */}
        {activeTab === 'files' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                 {currentFolderId && (
                   <button 
                     onClick={() => setCurrentFolderId(undefined)}
                     className="text-[10px] uppercase font-black tracking-widest text-zinc-500 hover:text-white flex items-center gap-2"
                   >
                     ← Root Directory
                   </button>
                 )}
                 <h2 className="text-2xl font-black uppercase tracking-tighter italic">
                    {currentFolderId ? 'Sub-Directory' : 'Root Directory'}
                 </h2>
              </div>
              <div className="flex gap-4">
                {!currentFolderId && (
                  <button 
                    onClick={() => setModals(m => ({ ...m, folder: true }))}
                    className="border border-zinc-800 px-6 py-3 text-[9px] font-black uppercase tracking-widest hover:border-white transition-all"
                  >
                    New Folder
                  </button>
                )}
                <button 
                  onClick={() => setModals(m => ({ ...m, file: true }))}
                  className="bg-white text-black px-6 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-fuchsia-studio hover:text-white transition-all"
                >
                  Upload File +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {/* Folders List (Only show in root) */}
              {!currentFolderId && folders.map(folder => (
                <div 
                  key={folder.id} 
                  onClick={() => setCurrentFolderId(folder.id)}
                  className="aspect-square bg-zinc-900 border border-zinc-800 p-6 flex flex-col justify-between cursor-pointer hover:border-fuchsia-studio hover:bg-zinc-900/80 transition-all stitch-corner group"
                >
                  <svg className="w-8 h-8 text-zinc-600 group-hover:text-fuchsia-studio transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span className="text-[10px] font-black uppercase tracking-wider truncate">{folder.name}</span>
                </div>
              ))}

              {/* Files List */}
              {files.map(file => (
                <div key={file.id} className="aspect-square bg-black border border-zinc-800 p-6 flex flex-col justify-between group hover:border-white transition-all">
                   <div className="flex justify-between items-start">
                      <svg className="w-8 h-8 text-zinc-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-[8px] font-mono text-zinc-600">{file.size}</span>
                   </div>
                   <span className="text-[10px] font-bold uppercase tracking-wider truncate text-zinc-300 group-hover:text-white">{file.name}</span>
                </div>
              ))}
            </div>
            
            {!currentFolderId && folders.length === 0 && files.length === 0 && (
              <div className="py-20 text-center text-zinc-600">
                <p className="uppercase tracking-[0.3em] text-[10px] font-black">Empty Directory</p>
              </div>
            )}
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'notes' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">Field Encryptions</h2>
              <button 
                onClick={() => setModals(m => ({ ...m, note: true }))}
                className="bg-white text-black px-6 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-fuchsia-studio hover:text-white transition-all"
              >
                New Entry +
              </button>
            </div>

            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {notes.length === 0 ? (
                 <div className="py-20 text-center text-zinc-600 col-span-full border border-dashed border-zinc-800">
                    <p className="uppercase tracking-[0.3em] text-[10px] font-black">No Logs Found.</p>
                 </div>
              ) : notes.map(note => (
                <div key={note.id} className="bg-zinc-900/30 border border-zinc-800 p-6 break-inside-avoid hover:border-fuchsia-studio/50 transition-all stitch-corner">
                  <h3 className="text-sm font-black uppercase tracking-wide mb-4 text-white">{note.title}</h3>
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-mono whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TEAM TAB */}
        {activeTab === 'team' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">Unit Members</h2>
              <button 
                onClick={() => setModals(m => ({ ...m, member: true }))}
                className="bg-white text-black px-6 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-fuchsia-studio hover:text-white transition-all"
              >
                Add Member +
              </button>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800">
              <div className="grid grid-cols-3 p-6 border-b border-zinc-800 text-[9px] uppercase font-black tracking-widest text-zinc-500">
                <span>Operative Name</span>
                <span>Role / Designation</span>
                <span className="text-right">Status</span>
              </div>
              {teamMembers.length === 0 ? (
                <div className="p-12 text-center">
                   <p className="uppercase tracking-[0.3em] text-[10px] font-black text-zinc-600">Unit Empty. No operatives assigned.</p>
                </div>
              ) : teamMembers.map(member => (
                <div key={member.id} className="grid grid-cols-3 p-6 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/50 transition-colors items-center">
                  <span className="text-sm font-bold text-white uppercase">{member.name}</span>
                  <span className="text-[10px] font-mono text-fuchsia-studio uppercase tracking-wider">{member.role}</span>
                  <div className="text-right">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      <Modal isOpen={modals.folder} onClose={() => setModals(m => ({ ...m, folder: false }))} title="New Directory">
        <form onSubmit={handleCreateFolder} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Folder Name</label>
            <input 
              autoFocus
              required
              className="w-full bg-zinc-900 border border-zinc-800 p-4 text-[10px] uppercase font-black tracking-widest outline-none focus:border-fuchsia-studio transition-colors text-white"
              value={folderName}
              onChange={e => setFolderName(e.target.value)}
              placeholder="PROJECT_ALPHA"
            />
          </div>
          <button disabled={actionLoading} className="w-full bg-white text-black py-4 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-fuchsia-studio hover:text-white transition-all">
            {actionLoading ? 'Creating...' : 'Create Folder'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={modals.file} onClose={() => setModals(m => ({ ...m, file: false }))} title="Upload Asset">
        <form onSubmit={handleCreateFile} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">File Name</label>
            <input 
              autoFocus
              required
              className="w-full bg-zinc-900 border border-zinc-800 p-4 text-[10px] uppercase font-black tracking-widest outline-none focus:border-fuchsia-studio transition-colors text-white"
              value={fileName}
              onChange={e => setFileName(e.target.value)}
              placeholder="BLUEPRINT_V1.PDF"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Size (Simulated)</label>
            <input 
              required
              className="w-full bg-zinc-900 border border-zinc-800 p-4 text-[10px] uppercase font-black tracking-widest outline-none focus:border-fuchsia-studio transition-colors text-white"
              value={fileSize}
              onChange={e => setFileSize(e.target.value)}
              placeholder="4.5 MB"
            />
          </div>
          <button disabled={actionLoading} className="w-full bg-white text-black py-4 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-fuchsia-studio hover:text-white transition-all">
            {actionLoading ? 'Uploading...' : 'Confirm Upload'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={modals.note} onClose={() => setModals(m => ({ ...m, note: false }))} title="Encrypted Log">
        <form onSubmit={handleCreateNote} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Title</label>
            <input 
              autoFocus
              required
              className="w-full bg-zinc-900 border border-zinc-800 p-4 text-[10px] uppercase font-black tracking-widest outline-none focus:border-fuchsia-studio transition-colors text-white"
              value={noteTitle}
              onChange={e => setNoteTitle(e.target.value)}
              placeholder="MISSION REPORT"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Content</label>
            <textarea 
              required
              rows={5}
              className="w-full bg-zinc-900 border border-zinc-800 p-4 text-[10px] font-mono outline-none focus:border-fuchsia-studio transition-colors text-white resize-none"
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              placeholder="Enter field notes..."
            />
          </div>
          <button disabled={actionLoading} className="w-full bg-white text-black py-4 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-fuchsia-studio hover:text-white transition-all">
            {actionLoading ? 'Saving...' : 'Save Log'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={modals.member} onClose={() => setModals(m => ({ ...m, member: false }))} title="Add Operative">
        <form onSubmit={handleAddMember} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Operative Name</label>
            <input 
              autoFocus
              required
              className="w-full bg-zinc-900 border border-zinc-800 p-4 text-[10px] uppercase font-black tracking-widest outline-none focus:border-fuchsia-studio transition-colors text-white"
              value={memberName}
              onChange={e => setMemberName(e.target.value)}
              placeholder="JOHN DOE"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Role / Designation</label>
            <input 
              required
              className="w-full bg-zinc-900 border border-zinc-800 p-4 text-[10px] uppercase font-black tracking-widest outline-none focus:border-fuchsia-studio transition-colors text-white"
              value={memberRole}
              onChange={e => setMemberRole(e.target.value)}
              placeholder="DESIGN LEAD"
            />
          </div>
          <button disabled={actionLoading} className="w-full bg-white text-black py-4 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-fuchsia-studio hover:text-white transition-all">
            {actionLoading ? 'Adding...' : 'Add to Unit'}
          </button>
        </form>
      </Modal>

    </div>
  );
};

export default Profile;
