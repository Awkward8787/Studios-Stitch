
import React, { useState, useEffect } from 'react';
import { User, Order, Download, Note, TeamMember, Address, Collection, WishlistItem, CollectionItem } from '../types';
import { firebaseService } from '../services/firebaseService';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';

interface ProfileProps {
  user: User;
}

type Tab = 'overview' | 'wishlist' | 'collections' | 'downloads' | 'notes' | 'team' | 'addresses';

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [activeCollectionItems, setActiveCollectionItems] = useState<CollectionItem[]>([]);
  const [viewingCollectionId, setViewingCollectionId] = useState<string | null>(null);

  // Modal State
  const [modals, setModals] = useState({
    collection: false,
    download: false,
    note: false,
    member: false,
    address: false,
    addToCollection: false
  });
  
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Forms
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [addressForm, setAddressForm] = useState<Partial<Address>>({});
  const [targetWishlistItem, setTargetWishlistItem] = useState<WishlistItem | null>(null);

  // Initial Load
  useEffect(() => {
    loadTabContent();
  }, [activeTab, user.id, viewingCollectionId]);

  const loadTabContent = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const data = await firebaseService.getOrders(user.id);
        setOrders(data);
      } else if (activeTab === 'wishlist') {
        const data = await firebaseService.getWishlist(user.id);
        setWishlist(data);
      } else if (activeTab === 'collections') {
        if (viewingCollectionId) {
           const items = await firebaseService.getCollectionItems(user.id, viewingCollectionId);
           setActiveCollectionItems(items);
        } else {
           const data = await firebaseService.getCollections(user.id);
           setCollections(data);
        }
      } else if (activeTab === 'downloads') {
        const data = await firebaseService.getDownloads(user.id);
        setDownloads(data);
      } else if (activeTab === 'notes') {
        const data = await firebaseService.getNotes(user.id);
        setNotes(data);
      } else if (activeTab === 'team') {
        const data = await firebaseService.getTeamMembers(user.id);
        setTeamMembers(data);
      } else if (activeTab === 'addresses') {
        const data = await firebaseService.getAddresses(user.id);
        setAddresses(data);
      }
    } catch (err) {
      console.error("DASHBOARD_FETCH_ERROR", err);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---

  const confirmAction = (title: string, message: string, action: () => Promise<void>) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        setActionLoading(true);
        await action();
        setActionLoading(false);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        loadTabContent();
      }
    });
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    await firebaseService.createCollection(user.id, newItemName, newItemDesc);
    setNewItemName('');
    setNewItemDesc('');
    setModals(m => ({ ...m, collection: false }));
    loadTabContent();
    setActionLoading(false);
  };

  const handleCreateDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    // Simulating file upload by just storing metadata
    await firebaseService.addDownload(user.id, newItemName, "2.4 MB", "other");
    setNewItemName('');
    setModals(m => ({ ...m, download: false }));
    loadTabContent();
    setActionLoading(false);
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    await firebaseService.createNote(user.id, newItemName, newItemDesc);
    setNewItemName('');
    setNewItemDesc('');
    setModals(m => ({ ...m, note: false }));
    loadTabContent();
    setActionLoading(false);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    await firebaseService.addTeamMember(user.id, newItemName, newItemDesc);
    setNewItemName('');
    setNewItemDesc('');
    setModals(m => ({ ...m, member: false }));
    loadTabContent();
    setActionLoading(false);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    if (addressForm.fullName && addressForm.line1 && addressForm.city && addressForm.state && addressForm.postalCode && addressForm.country) {
       await firebaseService.addAddress(user.id, addressForm as any);
       setAddressForm({});
       setModals(m => ({ ...m, address: false }));
       loadTabContent();
    }
    setActionLoading(false);
  };

  const handleAddToCollection = async (collectionId: string) => {
     if (!targetWishlistItem || !targetWishlistItem.productSnapshot) return;
     setActionLoading(true);
     await firebaseService.addItemToCollection(user.id, collectionId, targetWishlistItem.productId, targetWishlistItem.productSnapshot);
     setModals(m => ({ ...m, addToCollection: false }));
     setTargetWishlistItem(null);
     setActionLoading(false);
     alert("Added to collection!"); // Replacing simple alert with notification logic would be better but keeping simple for now inside handler logic
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
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 md:gap-12">
        <div className="space-y-4 max-w-full">
           <div className="inline-block bg-fuchsia-studio px-2 py-1 text-[8px] font-black uppercase tracking-[0.4em] text-white mb-2">Security Level: Authorized</div>
           <h1 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none italic break-all">{user.email.split('@')[0]}</h1>
           <p className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] font-black break-all">ID: {user.id}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-900/50 border-b border-zinc-800 mb-12 overflow-x-auto scrollbar-hide">
        {(['overview', 'wishlist', 'collections', 'downloads', 'notes', 'team', 'addresses'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setViewingCollectionId(null); }}
            className={`px-8 py-5 text-[10px] uppercase font-black tracking-[0.2em] transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab 
                ? 'border-fuchsia-studio text-white bg-zinc-900' 
                : 'border-transparent text-zinc-500 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in duration-500 pb-24">
        
        {/* OVERVIEW (ORDERS) */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="flex items-center gap-6 mb-8">
               <h2 className="text-2xl font-black uppercase tracking-tighter italic">Acquisition Log</h2>
               <div className="h-[1px] flex-1 bg-zinc-900" />
            </div>
             {orders.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-zinc-800">
                   <p className="text-zinc-700 uppercase tracking-[0.4em] text-[9px] font-black">No completed transactions found.</p>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="bg-zinc-900/40 border border-zinc-800 p-6 flex flex-col md:flex-row justify-between items-center gap-6 stitch-corner group hover:border-zinc-700 transition-colors">
                    <div className="flex items-center gap-6 w-full md:w-auto">
                      <div className="flex -space-x-4">
                        {order.items.slice(0, 3).map((item, i) => (
                          <div key={i} className="w-12 h-16 bg-black border border-zinc-800 overflow-hidden flex-shrink-0">
                             <img src={item.thumbnail_url} className="w-full h-full object-cover opacity-80" />
                          </div>
                        ))}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest break-all">#{order.orderNumber || order.id.slice(0,8)}</p>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase mt-1">Placed: {new Date(order.createdAt?.seconds * 1000 || order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto justify-between md:justify-end">
                       <span className={`px-3 py-1 text-[8px] font-black uppercase border ${
                          order.status === 'paid' || order.status === 'delivered' ? 'border-green-900 text-green-500' : 'border-zinc-800 text-zinc-500'
                       }`}>
                          {order.status}
                       </span>
                       <p className="text-xl font-black text-white italic w-24 text-right">${order.total.toFixed(2)}</p>
                       <button className="text-[9px] font-black text-fuchsia-studio uppercase tracking-widest hover:text-white transition-colors">
                         Invoice ↓
                       </button>
                    </div>
                  </div>
                ))
              )}
          </div>
        )}

        {/* WISHLIST */}
        {activeTab === 'wishlist' && (
          <div>
            <div className="flex items-center gap-6 mb-8">
               <h2 className="text-2xl font-black uppercase tracking-tighter italic">Saved Objects</h2>
               <div className="h-[1px] flex-1 bg-zinc-900" />
            </div>
            {wishlist.length === 0 ? (
               <div className="p-20 text-center border border-zinc-900 bg-zinc-900/10">
                 <p className="text-zinc-600 uppercase tracking-[0.3em] text-[10px] font-black">Manifest Empty.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 {wishlist.map(item => (
                   <div key={item.id} className="group bg-black border border-zinc-900 hover:border-fuchsia-studio/50 transition-all p-4 stitch-corner">
                      <div className="aspect-square bg-zinc-900 mb-4 overflow-hidden">
                        <img src={item.productSnapshot?.thumbnail_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                      </div>
                      <h3 className="text-[10px] font-black uppercase text-white truncate">{item.productSnapshot?.name}</h3>
                      <p className="text-xs font-black text-zinc-400 mt-1">${item.productSnapshot?.price?.toFixed(2)}</p>
                      
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-zinc-900">
                         <button 
                           onClick={() => confirmAction('Remove Item', 'Remove this item from your wishlist?', async () => firebaseService.removeFromWishlist(user.id, item.id))}
                           className="text-[8px] uppercase font-black tracking-widest text-zinc-600 hover:text-red-500"
                         >
                           Remove
                         </button>
                         <button 
                           onClick={() => {
                             setTargetWishlistItem(item);
                             setModals(m => ({ ...m, addToCollection: true }));
                             // Load collections if needed
                             if (collections.length === 0) firebaseService.getCollections(user.id).then(setCollections);
                           }}
                           className="text-[8px] uppercase font-black tracking-widest text-zinc-600 hover:text-white text-right"
                         >
                           + Collect
                         </button>
                      </div>
                   </div>
                 ))}
              </div>
            )}
          </div>
        )}

        {/* COLLECTIONS */}
        {activeTab === 'collections' && (
           <div>
             {!viewingCollectionId ? (
               <>
                 <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black uppercase tracking-tighter italic">Curated Folders</h2>
                    <button onClick={() => setModals(m => ({...m, collection: true}))} className="bg-white text-black px-6 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-fuchsia-studio hover:text-white transition-all">
                      New Collection +
                    </button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {collections.map(col => (
                       <div key={col.id} onClick={() => setViewingCollectionId(col.id)} className="bg-zinc-900/20 border border-zinc-800 p-8 cursor-pointer hover:border-fuchsia-studio hover:bg-zinc-900/40 transition-all group stitch-corner">
                          <h3 className="text-xl font-black uppercase italic text-white group-hover:text-fuchsia-studio transition-colors break-words">{col.name}</h3>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-2 break-words">{col.description || 'No description'}</p>
                          <div className="mt-8 pt-4 border-t border-zinc-800 flex justify-between items-center">
                             <span className="text-[8px] font-bold text-zinc-600 uppercase">Open Folder →</span>
                             <button 
                               onClick={(e) => { e.stopPropagation(); confirmAction('Delete Collection', 'This will delete the folder and all references.', async () => firebaseService.deleteCollection(user.id, col.id)); }}
                               className="text-[8px] font-bold text-zinc-700 hover:text-red-500 uppercase"
                             >
                               Delete
                             </button>
                          </div>
                       </div>
                    ))}
                 </div>
               </>
             ) : (
               <>
                 <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => setViewingCollectionId(null)} className="text-[10px] uppercase font-black tracking-widest text-zinc-500 hover:text-white">← Back</button>
                    <h2 className="text-2xl font-black uppercase tracking-tighter italic">Folder Contents</h2>
                 </div>
                 {activeCollectionItems.length === 0 ? (
                    <div className="p-12 text-center border border-dashed border-zinc-800">
                       <p className="text-zinc-600 uppercase tracking-[0.3em] text-[10px] font-black">Folder Empty.</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                       {activeCollectionItems.map(item => (
                          <div key={item.id} className="bg-black border border-zinc-900 p-4 stitch-corner">
                             <div className="aspect-square bg-zinc-900 mb-4">
                                <img src={item.productSnapshot?.thumbnail_url} className="w-full h-full object-cover grayscale" />
                             </div>
                             <h3 className="text-[9px] font-black uppercase text-white truncate">{item.productSnapshot?.name}</h3>
                             <button 
                               onClick={() => confirmAction('Remove Item', 'Remove from collection?', async () => {
                                  await firebaseService.removeItemFromCollection(user.id, viewingCollectionId, item.id);
                                  // Refresh items manually or rely on effect dependency
                                  const updated = await firebaseService.getCollectionItems(user.id, viewingCollectionId);
                                  setActiveCollectionItems(updated);
                               })}
                               className="mt-4 w-full border border-zinc-800 py-2 text-[8px] font-black uppercase tracking-widest hover:bg-red-900/20 hover:text-red-500 hover:border-red-900 transition-colors"
                             >
                               Remove
                             </button>
                          </div>
                       ))}
                    </div>
                 )}
               </>
             )}
           </div>
        )}

        {/* DOWNLOADS */}
        {activeTab === 'downloads' && (
           <div>
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-black uppercase tracking-tighter italic">Digital Assets</h2>
                 <button onClick={() => setModals(m => ({...m, download: true}))} className="bg-white text-black px-6 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-fuchsia-studio hover:text-white transition-all">
                   Upload File +
                 </button>
              </div>
              <div className="bg-zinc-900/20 border border-zinc-800 overflow-x-auto">
                 <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-zinc-900 text-[8px] uppercase font-black tracking-widest text-zinc-500">
                       <tr>
                          <th className="p-4">Filename</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Size</th>
                          <th className="p-4 text-right">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-[10px] font-bold text-zinc-300">
                       {downloads.map(file => (
                          <tr key={file.id} className="hover:bg-zinc-900/40 transition-colors">
                             <td className="p-4">{file.title}</td>
                             <td className="p-4 text-fuchsia-studio">{file.type}</td>
                             <td className="p-4 font-mono text-zinc-500">{file.size}</td>
                             <td className="p-4 text-right flex justify-end gap-4">
                                <button className="hover:text-white transition-colors">Download</button>
                                <button onClick={() => confirmAction('Delete File', 'Permanently delete this file?', async () => firebaseService.deleteDownload(user.id, file.id))} className="text-zinc-600 hover:text-red-500 transition-colors">Delete</button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
                 {downloads.length === 0 && <div className="p-8 text-center text-[10px] uppercase text-zinc-600 font-black tracking-widest">No downloads available.</div>}
              </div>
           </div>
        )}

        {/* NOTES */}
        {activeTab === 'notes' && (
           <div>
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-black uppercase tracking-tighter italic">Field Notes</h2>
                 <button onClick={() => setModals(m => ({...m, note: true}))} className="bg-white text-black px-6 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-fuchsia-studio hover:text-white transition-all">
                   New Note +
                 </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {notes.map(note => (
                    <div key={note.id} className="bg-zinc-900/30 border border-zinc-800 p-6 stitch-corner group">
                       <h3 className="text-sm font-black uppercase text-white mb-2 break-words">{note.title}</h3>
                       <p className="text-[10px] text-zinc-400 font-mono whitespace-pre-wrap break-words">{note.content}</p>
                       <button 
                         onClick={() => confirmAction('Delete Note', 'Delete this field note?', async () => firebaseService.deleteNote(user.id, note.id))}
                         className="mt-6 text-[8px] font-black uppercase tracking-widest text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                         Delete Entry
                       </button>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* TEAM */}
        {activeTab === 'team' && (
           <div>
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-black uppercase tracking-tighter italic">Unit Roster</h2>
                 <button onClick={() => setModals(m => ({...m, member: true}))} className="bg-white text-black px-6 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-fuchsia-studio hover:text-white transition-all">
                   Add Operative +
                 </button>
              </div>
              <div className="border border-zinc-800 divide-y divide-zinc-800">
                 {teamMembers.map(member => (
                    <div key={member.id} className="p-4 flex justify-between items-center hover:bg-zinc-900/30 transition-colors">
                       <div>
                          <p className="text-sm font-black uppercase text-white break-words">{member.name}</p>
                          <p className="text-[9px] font-bold text-fuchsia-studio uppercase tracking-widest break-words">{member.role}</p>
                       </div>
                       <button onClick={() => confirmAction('Remove Member', 'Remove this operative from the unit?', async () => firebaseService.deleteTeamMember(user.id, member.id))} className="text-[8px] font-black uppercase tracking-widest text-zinc-600 hover:text-red-500">
                          Discharge
                       </button>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* ADDRESSES */}
        {activeTab === 'addresses' && (
           <div>
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-black uppercase tracking-tighter italic">Shipping Nodes</h2>
                 <button onClick={() => setModals(m => ({...m, address: true}))} className="bg-white text-black px-6 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-fuchsia-studio hover:text-white transition-all">
                   Add Node +
                 </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {addresses.map(addr => (
                    <div key={addr.id} className={`p-6 border ${addr.isDefault ? 'border-fuchsia-studio bg-fuchsia-studio/5' : 'border-zinc-800 bg-zinc-900/20'} stitch-corner`}>
                       <div className="flex justify-between items-start mb-4">
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{addr.label}</span>
                          {addr.isDefault && <span className="text-[8px] font-black uppercase bg-fuchsia-studio text-white px-2 py-1">Default</span>}
                       </div>
                       <p className="font-bold text-white uppercase text-sm break-words">{addr.fullName}</p>
                       <p className="text-[10px] text-zinc-400 uppercase mt-2 leading-relaxed break-words">
                          {addr.line1}<br/>
                          {addr.line2 && <>{addr.line2}<br/></>}
                          {addr.city}, {addr.state} {addr.postalCode}<br/>
                          {addr.country}
                       </p>
                       <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
                          <button onClick={() => confirmAction('Delete Node', 'Remove this shipping address?', async () => firebaseService.deleteAddress(user.id, addr.id))} className="text-[8px] font-black uppercase tracking-widest text-zinc-600 hover:text-red-500">
                             Delete
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

      </div>

      {/* --- MODALS --- */}
      
      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} 
        onConfirm={confirmModal.onConfirm} 
        title={confirmModal.title} 
        message={confirmModal.message}
        isLoading={actionLoading}
      />

      {/* Collection Modal */}
      <Modal isOpen={modals.collection} onClose={() => setModals(m => ({ ...m, collection: false }))} title="New Collection">
         <form onSubmit={handleCreateCollection} className="space-y-6">
            <div className="space-y-2">
               <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Collection Name</label>
               <input autoFocus required className="w-full bg-zinc-900 border border-zinc-800 p-4 text-[10px] uppercase font-black tracking-widest outline-none text-white focus:border-fuchsia-studio" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="SUMMER_ARCHIVE" />
            </div>
            <div className="space-y-2">
               <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Description</label>
               <input className="w-full bg-zinc-900 border border-zinc-800 p-4 text-[10px] uppercase font-black tracking-widest outline-none text-white focus:border-fuchsia-studio" value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} placeholder="OPTIONAL" />
            </div>
            <button disabled={actionLoading} className="w-full bg-white text-black py-4 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-fuchsia-studio hover:text-white transition-all">{actionLoading ? 'Saving...' : 'Create Folder'}</button>
         </form>
      </Modal>

      {/* Add To Collection Modal */}
      <Modal isOpen={modals.addToCollection} onClose={() => setModals(m => ({ ...m, addToCollection: false }))} title="Add to Collection">
         <div className="space-y-4">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4">Select destination folder:</p>
            {collections.map(col => (
               <button 
                  key={col.id} 
                  onClick={() => handleAddToCollection(col.id)}
                  className="w-full text-left bg-zinc-900 border border-zinc-800 p-4 hover:border-fuchsia-studio hover:bg-zinc-800 transition-all flex justify-between items-center"
               >
                  <span className="text-[10px] font-black uppercase text-white truncate mr-2">{col.name}</span>
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest flex-shrink-0">Select →</span>
               </button>
            ))}
            {collections.length === 0 && <p className="text-[10px] text-red-500 uppercase font-bold">No collections found. Create one first.</p>}
         </div>
      </Modal>

      {/* Address Modal */}
      <Modal isOpen={modals.address} onClose={() => setModals(m => ({ ...m, address: false }))} title="New Shipping Node">
         <form onSubmit={handleSaveAddress} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Label</label>
                  <input required className="w-full bg-zinc-900 border border-zinc-800 p-3 text-[10px] uppercase font-black tracking-widest outline-none text-white focus:border-fuchsia-studio" value={addressForm.label || ''} onChange={e => setAddressForm({...addressForm, label: e.target.value})} placeholder="HOME" />
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Full Name</label>
                  <input required className="w-full bg-zinc-900 border border-zinc-800 p-3 text-[10px] uppercase font-black tracking-widest outline-none text-white focus:border-fuchsia-studio" value={addressForm.fullName || ''} onChange={e => setAddressForm({...addressForm, fullName: e.target.value})} placeholder="JOHN DOE" />
               </div>
            </div>
            <div className="space-y-2">
               <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Address Line 1</label>
               <input required className="w-full bg-zinc-900 border border-zinc-800 p-3 text-[10px] uppercase font-black tracking-widest outline-none text-white focus:border-fuchsia-studio" value={addressForm.line1 || ''} onChange={e => setAddressForm({...addressForm, line1: e.target.value})} placeholder="123 STREET" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <input required className="w-full bg-zinc-900 border border-zinc-800 p-3 text-[10px] uppercase font-black tracking-widest outline-none text-white focus:border-fuchsia-studio" value={addressForm.city || ''} onChange={e => setAddressForm({...addressForm, city: e.target.value})} placeholder="CITY" />
               <input required className="w-full bg-zinc-900 border border-zinc-800 p-3 text-[10px] uppercase font-black tracking-widest outline-none text-white focus:border-fuchsia-studio" value={addressForm.state || ''} onChange={e => setAddressForm({...addressForm, state: e.target.value})} placeholder="STATE" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <input required className="w-full bg-zinc-900 border border-zinc-800 p-3 text-[10px] uppercase font-black tracking-widest outline-none text-white focus:border-fuchsia-studio" value={addressForm.postalCode || ''} onChange={e => setAddressForm({...addressForm, postalCode: e.target.value})} placeholder="ZIP CODE" />
               <input required className="w-full bg-zinc-900 border border-zinc-800 p-3 text-[10px] uppercase font-black tracking-widest outline-none text-white focus:border-fuchsia-studio" value={addressForm.country || ''} onChange={e => setAddressForm({...addressForm, country: e.target.value})} placeholder="COUNTRY" />
            </div>
            <div className="flex items-center gap-2 mt-2">
               <input type="checkbox" checked={addressForm.isDefault || false} onChange={e => setAddressForm({...addressForm, isDefault: e.target.checked})} />
               <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Set as default</span>
            </div>
            <button disabled={actionLoading} className="w-full bg-white text-black py-4 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-fuchsia-studio hover:text-white transition-all mt-4">{actionLoading ? 'Saving...' : 'Save Node'}</button>
         </form>
      </Modal>

      {/* Note Modal */}
      <Modal isOpen={modals.note} onClose={() => setModals(m => ({ ...m, note: false }))} title="New Field Note">
         <form onSubmit={handleCreateNote} className="space-y-6">
            <input autoFocus required className="w-full bg-zinc-900 border border-zinc-800 p-4 text-[10px] uppercase font-black tracking-widest outline-none text-white focus:border-fuchsia-studio" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="TITLE" />
            <textarea required rows={5} className="w-full bg-zinc-900 border border-zinc-800 p-4 text-[10px] font-mono outline-none text-white focus:border-fuchsia-studio resize-none" value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} placeholder="CONTENT..." />
            <button disabled={actionLoading} className="w-full bg-white text-black py-4 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-fuchsia-studio hover:text-white transition-all">{actionLoading ? 'Saving...' : 'Save Note'}</button>
         </form>
      </Modal>
      
      {/* Download Modal */}
      <Modal isOpen={modals.download} onClose={() => setModals(m => ({ ...m, download: false }))} title="Upload Asset">
         <form onSubmit={handleCreateDownload} className="space-y-6">
            <input autoFocus required className="w-full bg-zinc-900 border border-zinc-800 p-4 text-[10px] uppercase font-black tracking-widest outline-none text-white focus:border-fuchsia-studio" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="FILENAME" />
            <div className="p-8 border-2 border-dashed border-zinc-800 text-center text-[9px] uppercase font-black tracking-widest text-zinc-600">
               Drag & Drop File Simulation
            </div>
            <button disabled={actionLoading} className="w-full bg-white text-black py-4 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-fuchsia-studio hover:text-white transition-all">{actionLoading ? 'Uploading...' : 'Confirm Upload'}</button>
         </form>
      </Modal>

       {/* Team Modal */}
      <Modal isOpen={modals.member} onClose={() => setModals(m => ({ ...m, member: false }))} title="Add Operative">
         <form onSubmit={handleAddMember} className="space-y-6">
            <input autoFocus required className="w-full bg-zinc-900 border border-zinc-800 p-4 text-[10px] uppercase font-black tracking-widest outline-none text-white focus:border-fuchsia-studio" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="NAME" />
            <input required className="w-full bg-zinc-900 border border-zinc-800 p-4 text-[10px] uppercase font-black tracking-widest outline-none text-white focus:border-fuchsia-studio" value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} placeholder="ROLE" />
            <button disabled={actionLoading} className="w-full bg-white text-black py-4 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-fuchsia-studio hover:text-white transition-all">{actionLoading ? 'Adding...' : 'Add Member'}</button>
         </form>
      </Modal>

    </div>
  );
};

export default Profile;
