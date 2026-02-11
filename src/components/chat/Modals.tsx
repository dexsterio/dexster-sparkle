import React, { useState, useRef, useCallback } from 'react';
import { Chat, Message, ChatType, GroupPermissions, InviteLink, AdminEntry, AdminPermissions, User, MemberRestriction, BannedUserEntry, SignatureMode } from '@/types/chat';
import { X, Copy, Trash2, Plus, Shield, Crown, Link, Camera, Image, Users, Bell, Clock, Lock, MessageSquare, Hash, Globe, Eye, EyeOff, AlertTriangle, Megaphone, ChevronRight, Ban, UserMinus, Settings } from 'lucide-react';
import { useUserSearch } from '@/hooks/useUserSearch';

const MODAL_BACKDROP = "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.15s_ease-out]";
const MODAL_CARD = "bg-card rounded-2xl shadow-2xl animate-[modalIn_0.2s_ease-out]";

// ============= DELETE DIALOG =============
interface DeleteDialogProps {
  message: Message;
  chatName: string;
  onConfirm: (forAll: boolean) => void;
  onCancel: () => void;
}

export const DeleteDialog: React.FC<DeleteDialogProps> = ({ message, chatName, onConfirm, onCancel }) => {
  const [forAll, setForAll] = useState(false);
  return (
    <div className={MODAL_BACKDROP} onClick={onCancel}>
      <div className={`${MODAL_CARD} p-6 w-[380px]`} onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-foreground mb-2">Delete Message</h3>
        <p className="text-sm text-muted-foreground mb-4">Are you sure you want to delete this message?</p>
        {message.isOwn && (
          <label className="flex items-center gap-2 text-sm text-foreground mb-4 cursor-pointer">
            <input type="checkbox" checked={forAll} onChange={() => setForAll(!forAll)} className="rounded border-border accent-primary" />
            Also delete for {chatName}
          </label>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-dex-hover transition-colors">Cancel</button>
          <button onClick={() => onConfirm(forAll)} className="px-4 py-2 rounded-lg text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">🗑️ Delete</button>
        </div>
      </div>
    </div>
  );
};

// ============= FORWARD MODAL =============
interface ForwardModalProps {
  chats: Chat[];
  onForward: (chatId: string) => void;
  onCancel: () => void;
}

export const ForwardModal: React.FC<ForwardModalProps> = ({ chats, onForward, onCancel }) => {
  const [search, setSearch] = useState('');
  const filtered = chats.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className={MODAL_BACKDROP} onClick={onCancel}>
      <div className={`${MODAL_CARD} p-5 w-[400px] max-h-[500px] flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-foreground">Forward to...</h3>
          <button onClick={onCancel} className="p-1 rounded hover:bg-dex-hover text-muted-foreground"><X size={18} /></button>
        </div>
        <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
          className="w-full px-3 py-2 rounded-full bg-muted border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary mb-3" />
        <div className="flex-1 overflow-y-auto space-y-0.5">
          {filtered.map(c => (
            <button key={c.id} onClick={() => onForward(c.id)} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-dex-hover transition-colors">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ background: `hsl(${c.avatarColor})` }}>{c.avatar}</div>
              <span className="text-sm text-foreground">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============= AVATAR UPLOAD COMPONENT =============
const AvatarUpload: React.FC<{ 
  avatarPreview: string | null; 
  avatarUrl?: string;
  fallback: string;
  fallbackColor: string;
  size?: 'sm' | 'lg';
  onSelect: (file: File) => void;
}> = ({ avatarPreview, avatarUrl, fallback, fallbackColor, size = 'lg', onSelect }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const dim = size === 'lg' ? 'w-20 h-20' : 'w-16 h-16';
  const iconSize = size === 'lg' ? 24 : 18;
  
  return (
    <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
        const f = e.target.files?.[0];
        if (f) onSelect(f);
      }} />
      {avatarPreview || avatarUrl ? (
        <img src={avatarPreview || avatarUrl} alt="Avatar" className={`${dim} rounded-full object-cover`} />
      ) : (
        <div className={`${dim} rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground/40`}
          style={fallback !== '📷' ? { background: `hsl(${fallbackColor})` } : {}}>
          {fallback === '📷' ? <Camera size={iconSize} /> : <span className="text-xl font-bold text-white">{fallback}</span>}
        </div>
      )}
      <div className={`absolute inset-0 ${dim} rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
        <Camera size={iconSize} className="text-white" />
      </div>
    </div>
  );
};

// ============= TOGGLE SWITCH =============
const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({ value, onChange }) => (
  <button onClick={() => onChange(!value)} className={`w-10 h-[22px] rounded-full transition-colors ${value ? 'bg-primary' : 'bg-muted'} flex items-center ${value ? 'justify-end' : 'justify-start'} px-0.5`}>
    <div className="w-[18px] h-[18px] rounded-full bg-white transition-all" />
  </button>
);

// ============= CREATE CHANNEL MODAL =============
interface CreateChannelModalProps {
  onClose: () => void;
  onCreate: (data: {
    name: string;
    description: string;
    isPublic: boolean;
    comments: boolean;
    reactions: boolean;
    avatarFile?: File;
    signMessages: boolean;
    joinApproval: boolean;
  }) => void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ onClose, onCreate }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [comments, setComments] = useState(true);
  const [reactions, setReactions] = useState(true);
  const [signMessages, setSignMessages] = useState(false);
  const [joinApproval, setJoinApproval] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarSelect = useCallback((file: File) => {
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleCreate = () => {
    onCreate({
      name, description, isPublic, comments, reactions,
      avatarFile: avatarFile || undefined,
      signMessages, joinApproval,
    });
  };

  return (
    <div className={MODAL_BACKDROP} onClick={onClose}>
      <div className={`${MODAL_CARD} p-6 w-[440px] max-h-[85vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        {/* Header with step indicator */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-foreground">
              {step === 1 ? 'New Channel' : step === 2 ? 'Channel Type' : 'Settings'}
            </h3>
            <div className="flex gap-1">
              {[1, 2, 3].map(s => (
                <div key={s} className={`w-2 h-2 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-dex-hover text-muted-foreground"><X size={18} /></button>
        </div>

        {step === 1 && (
          <>
            {/* Avatar upload */}
            <div className="flex justify-center mb-5">
              <AvatarUpload
                avatarPreview={avatarPreview}
                fallback="📷"
                fallbackColor=""
                onSelect={handleAvatarSelect}
              />
            </div>
            <p className="text-center text-xs text-muted-foreground mb-4">Tap to add a channel photo</p>

            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Channel Name</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} maxLength={64}
              className="w-full mt-1 mb-1 px-3 py-2.5 rounded-lg bg-muted text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Channel name" />
            <p className="text-[10px] text-muted-foreground mb-3">{name.length}/64</p>

            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={255}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-muted text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none" placeholder="What is this channel about?" />
            <p className="text-[10px] text-muted-foreground mt-1">{description.length}/255</p>

            <div className="flex justify-end mt-4">
              <button disabled={!name.trim()} onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-40 transition-opacity font-medium">
                Next
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { pub: true, icon: <Globe size={20} />, label: 'Public Channel', desc: 'Anyone can find and join via search' },
                { pub: false, icon: <Lock size={20} />, label: 'Private Channel', desc: 'Only accessible via invite link' },
              ].map(opt => (
                <button key={String(opt.pub)} onClick={() => setIsPublic(opt.pub)}
                  className={`p-4 rounded-xl border text-left transition-all ${isPublic === opt.pub ? 'border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]' : 'border-border hover:bg-dex-hover'}`}>
                  <div className={`mb-2 ${isPublic === opt.pub ? 'text-primary' : 'text-muted-foreground'}`}>{opt.icon}</div>
                  <div className="text-sm font-semibold text-foreground">{opt.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>

            {isPublic && name.trim() && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                <div className="flex items-start gap-2">
                  <Globe size={14} className="text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-foreground font-medium">Public link</p>
                    <p className="text-sm text-primary font-mono mt-0.5">https://dexst.me/{name.trim().toLowerCase().replace(/\s+/g, '')}</p>
                  </div>
                </div>
              </div>
            )}

            {!isPublic && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border mb-4">
                <div className="flex items-start gap-2">
                  <Link size={14} className="text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-foreground font-medium">Private invite link</p>
                    <p className="text-[11px] text-muted-foreground">A unique dexst.me invite link will be generated after creating the channel.</p>
                  </div>
                </div>
              </div>
            )}

            {isPublic && (
              <div className="mb-4">
                <div className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-dex-hover">
                  <div>
                    <span className="text-sm text-foreground">Join approval</span>
                    <div className="text-[11px] text-muted-foreground">Review join requests before accepting</div>
                  </div>
                  <Toggle value={joinApproval} onChange={setJoinApproval} />
                </div>
              </div>
            )}

            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-dex-hover transition-colors">Back</button>
              <button onClick={() => setStep(3)} className="px-5 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground font-medium">Next</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="space-y-1 mb-5">
              {[
                { icon: <MessageSquare size={16} />, label: 'Allow Comments', desc: 'Enable discussion threads under posts', value: comments, set: setComments },
                { icon: <span className="text-sm">😊</span>, label: 'Allow Reactions', desc: 'Let subscribers react to posts', value: reactions, set: setReactions },
                { icon: <Megaphone size={16} />, label: 'Sign Messages', desc: 'Show admin name on channel posts', value: signMessages, set: setSignMessages },
              ].map(t => (
                <div key={t.label} className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-dex-hover">
                  <div className="flex items-center gap-2.5">
                    <span className="text-muted-foreground">{t.icon}</span>
                    <div>
                      <span className="text-sm text-foreground">{t.label}</span>
                      <div className="text-[11px] text-muted-foreground">{t.desc}</div>
                    </div>
                  </div>
                  <Toggle value={t.value} onChange={t.set} />
                </div>
              ))}
            </div>

            {/* Preview card */}
            <div className="p-3 rounded-xl border border-border bg-dex-surface mb-5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Preview</p>
              <div className="flex items-center gap-3">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground truncate">{name}</span>
                    {isPublic ? <Globe size={12} className="text-muted-foreground flex-shrink-0" /> : <Lock size={12} className="text-muted-foreground flex-shrink-0" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{description || 'No description'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-dex-hover transition-colors">Back</button>
              <button onClick={handleCreate}
                className="px-6 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                Create Channel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ============= CREATE GROUP MODAL (3-step wizard, Telegram-style) =============
interface CreateGroupModalProps {
  onClose: () => void;
  onCreate: (data: {
    name: string;
    description: string;
    isPublic: boolean;
    joinApproval: boolean;
    chatHistoryForNewMembers: boolean;
    memberIds: string[];
    avatarFile?: File;
  }) => void;
  recentContacts?: { id: string; name: string; avatar: string; avatarColor: string; online?: boolean }[];
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onCreate, recentContacts }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [joinApproval, setJoinApproval] = useState(false);
  const [chatHistory, setChatHistory] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Map<string, { id: string; name: string; avatar: string; color: string }>>(new Map());

  const { data: searchResults, isLoading: isSearching } = useUserSearch(searchQuery);

  const handleAvatarSelect = useCallback((file: File) => {
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const toggleMember = (user: { id: number; displayName: string; username: string; avatarUrl: string | null }) => {
    const idStr = String(user.id);
    setSelectedMembers(prev => {
      const next = new Map(prev);
      if (next.has(idStr)) {
        next.delete(idStr);
      } else {
        const initials = (user.displayName || user.username).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        const hue = (user.id * 137) % 360;
        next.set(idStr, { id: idStr, name: user.displayName || user.username, avatar: initials, color: `${hue} 65% 55%` });
      }
      return next;
    });
  };

  const handleCreate = () => {
    onCreate({
      name, description, isPublic, joinApproval, chatHistoryForNewMembers: chatHistory,
      memberIds: Array.from(selectedMembers.keys()),
      avatarFile: avatarFile || undefined,
    });
  };

  return (
    <div className={MODAL_BACKDROP} onClick={onClose}>
      <div className={`${MODAL_CARD} p-6 w-[440px] max-h-[85vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        {/* Header with step indicator */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-foreground">
              {step === 1 ? 'New Group' : step === 2 ? 'Privacy & Settings' : 'Add Members'}
            </h3>
            <div className="flex gap-1">
              {[1, 2, 3].map(s => (
                <div key={s} className={`w-2 h-2 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-dex-hover text-muted-foreground"><X size={18} /></button>
        </div>

        {/* Step 1: Identity */}
        {step === 1 && (
          <>
            <div className="flex justify-center mb-5">
              <AvatarUpload
                avatarPreview={avatarPreview}
                fallback="📷"
                fallbackColor=""
                onSelect={handleAvatarSelect}
              />
            </div>
            <p className="text-center text-xs text-muted-foreground mb-4">Tap to add a group photo</p>

            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Group Name</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} maxLength={64}
              className="w-full mt-1 mb-1 px-3 py-2.5 rounded-lg bg-muted text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Group name" />
            <p className="text-[10px] text-muted-foreground mb-3">{name.length}/64</p>

            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={255}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-muted text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none" placeholder="What is this group about?" />
            <p className="text-[10px] text-muted-foreground mt-1">{description.length}/255</p>

            <div className="flex justify-end mt-4">
              <button disabled={!name.trim()} onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-40 transition-opacity font-medium">
                Next
              </button>
            </div>
          </>
        )}

        {/* Step 2: Privacy & Settings */}
        {step === 2 && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { pub: true, icon: <Globe size={20} />, label: 'Public Group', desc: 'Anyone can find and join via search' },
                { pub: false, icon: <Lock size={20} />, label: 'Private Group', desc: 'Only accessible via invite link' },
              ].map(opt => (
                <button key={String(opt.pub)} onClick={() => setIsPublic(opt.pub)}
                  className={`p-4 rounded-xl border text-left transition-all ${isPublic === opt.pub ? 'border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]' : 'border-border hover:bg-dex-hover'}`}>
                  <div className={`mb-2 ${isPublic === opt.pub ? 'text-primary' : 'text-muted-foreground'}`}>{opt.icon}</div>
                  <div className="text-sm font-semibold text-foreground">{opt.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>

            {isPublic && name.trim() && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                <div className="flex items-start gap-2">
                  <Globe size={14} className="text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-foreground font-medium">Public link</p>
                    <p className="text-sm text-primary font-mono mt-0.5">https://dexst.me/{name.trim().toLowerCase().replace(/\s+/g, '')}</p>
                  </div>
                </div>
              </div>
            )}

            {!isPublic && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border mb-4">
                <div className="flex items-start gap-2">
                  <Link size={14} className="text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-foreground font-medium">Private invite link</p>
                    <p className="text-[11px] text-muted-foreground">A unique dexst.me invite link will be generated after creating the group.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-0.5 mb-4">
              {isPublic && (
                <div className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-dex-hover">
                  <div>
                    <span className="text-sm text-foreground">Join approval</span>
                    <div className="text-[11px] text-muted-foreground">Review join requests before accepting</div>
                  </div>
                  <Toggle value={joinApproval} onChange={setJoinApproval} />
                </div>
              )}
              <div className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-dex-hover">
                <div>
                  <span className="text-sm text-foreground">Chat history for new members</span>
                  <div className="text-[11px] text-muted-foreground">{chatHistory ? 'New members can see old messages' : 'History hidden from new members'}</div>
                </div>
                <Toggle value={chatHistory} onChange={setChatHistory} />
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-dex-hover transition-colors">Back</button>
              <button onClick={() => setStep(3)} className="px-5 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground font-medium">Next</button>
            </div>
          </>
        )}

        {/* Step 3: Add Members */}
        {step === 3 && (
          <>
            {/* Selected members chips */}
            {selectedMembers.size > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {Array.from(selectedMembers.values()).map(m => (
                  <span key={m.id} className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs text-foreground">
                    {m.name}
                    <button onClick={() => setSelectedMembers(prev => { const n = new Map(prev); n.delete(m.id); return n; })} className="text-muted-foreground hover:text-destructive">×</button>
                  </span>
                ))}
              </div>
            )}

            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Search & Add Members ({selectedMembers.size})</label>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full mb-2 px-3 py-2 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex-1 overflow-y-auto space-y-1 mb-4 min-h-[120px] max-h-[250px]">
              {/* Recent contacts */}
              {searchQuery.length < 2 && recentContacts && recentContacts.length > 0 && (
                <div className="mb-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Recent</p>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none px-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {recentContacts.filter(c => !selectedMembers.has(c.id)).map(c => (
                      <button key={c.id} onClick={() => {
                        const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                        setSelectedMembers(prev => { const n = new Map(prev); n.set(c.id, { id: c.id, name: c.name, avatar: initials, color: c.avatarColor }); return n; });
                      }}
                        className="flex flex-col items-center gap-1.5 min-w-[56px] group">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold text-white transition-transform group-hover:scale-105"
                          style={{ background: `hsl(${c.avatarColor})` }}>
                          {c.avatar}
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate w-full text-center">{c.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {isSearching && <p className="text-xs text-muted-foreground text-center py-3">Searching...</p>}
              {searchQuery.length < 2 && !isSearching && !recentContacts?.length && (
                <p className="text-xs text-muted-foreground text-center py-3">Type at least 2 characters to search</p>
              )}
              {searchResults?.map(u => (
                <button key={u.id} onClick={() => toggleMember(u)}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors ${selectedMembers.has(String(u.id)) ? 'bg-primary/10 border border-primary/30' : 'hover:bg-dex-hover border border-transparent'}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ background: `hsl(${(u.id * 137) % 360} 65% 55%)` }}>
                    {(u.displayName || u.username).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm text-foreground">{u.displayName || u.username}</span>
                    <p className="text-[11px] text-muted-foreground">@{u.username}</p>
                  </div>
                  {selectedMembers.has(String(u.id)) && <span className="text-primary">✓</span>}
                </button>
              ))}
              {searchResults?.length === 0 && searchQuery.length >= 2 && !isSearching && (
                <p className="text-xs text-muted-foreground text-center py-3">No users found</p>
              )}
            </div>

            {/* Preview card */}
            <div className="p-3 rounded-xl border border-border bg-dex-surface mb-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Preview</p>
              <div className="flex items-center gap-3">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                    {name.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground truncate">{name || 'Group'}</span>
                    {isPublic ? <Globe size={12} className="text-muted-foreground flex-shrink-0" /> : <Lock size={12} className="text-muted-foreground flex-shrink-0" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{selectedMembers.size} member{selectedMembers.size !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-dex-hover transition-colors">Back</button>
              <button disabled={selectedMembers.size === 0} onClick={handleCreate}
                className="px-6 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-40">
                Create Group
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ============= POLL CREATION MODAL =============
interface PollCreationModalProps {
  onClose: () => void;
  onCreate: (question: string, options: string[], multiChoice: boolean, quizMode: boolean, correctOption?: number, explanation?: string) => void;
}

export const PollCreationModal: React.FC<PollCreationModalProps> = ({ onClose, onCreate }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [multiChoice, setMultiChoice] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [correctOption, setCorrectOption] = useState(0);
  const [explanation, setExplanation] = useState('');

  const addOption = () => setOptions([...options, '']);
  const removeOption = (i: number) => setOptions(options.filter((_, idx) => idx !== i));
  const updateOption = (i: number, val: string) => setOptions(options.map((o, idx) => idx === i ? val : o));
  const validOptions = options.filter(o => o.trim());

  return (
    <div className={MODAL_BACKDROP} onClick={onClose}>
      <div className={`${MODAL_CARD} p-6 w-[420px] max-h-[600px] flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">📊 Create Poll</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-dex-hover text-muted-foreground"><X size={18} /></button>
        </div>
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Question</label>
        <input value={question} onChange={e => setQuestion(e.target.value)} className="w-full mt-1 mb-3 px-3 py-2 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Ask a question..." />

        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Options</label>
        <div className="flex-1 overflow-y-auto space-y-2 mb-3">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              {quizMode && (
                <button onClick={() => setCorrectOption(i)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${correctOption === i ? 'border-dex-online bg-dex-online' : 'border-muted-foreground/40'}`}>
                  {correctOption === i && <span className="text-white text-[10px]">✓</span>}
                </button>
              )}
              <input value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Option ${i + 1}`}
                className="flex-1 px-3 py-2 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              {options.length > 2 && (
                <button onClick={() => removeOption(i)} className="p-1 text-muted-foreground hover:text-destructive"><X size={14} /></button>
              )}
            </div>
          ))}
          {options.length < 10 && (
            <button onClick={addOption} className="text-xs text-primary hover:underline">+ Add option</button>
          )}
        </div>

        <div className="space-y-2 mb-4">
          {[
            { label: 'Multiple choice', value: multiChoice, set: setMultiChoice },
            { label: 'Quiz mode', value: quizMode, set: setQuizMode },
          ].map(t => (
            <div key={t.label} className="flex items-center justify-between py-1">
              <span className="text-sm text-foreground">{t.label}</span>
              <button onClick={() => t.set(!t.value)} className={`w-9 h-5 rounded-full transition-colors ${t.value ? 'bg-primary' : 'bg-muted'} flex items-center ${t.value ? 'justify-end' : 'justify-start'} px-0.5`}>
                <div className="w-4 h-4 rounded-full bg-white transition-all" />
              </button>
            </div>
          ))}
        </div>

        {quizMode && (
          <div className="mb-4">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Explanation (optional)</label>
            <input value={explanation} onChange={e => setExplanation(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Why is this the correct answer?" />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-dex-hover">Cancel</button>
          <button disabled={!question.trim() || validOptions.length < 2}
            onClick={() => onCreate(question, validOptions, multiChoice, quizMode, quizMode ? correctOption : undefined, quizMode ? explanation : undefined)}
            className="px-5 py-2 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-40">Create Poll</button>
        </div>
      </div>
    </div>
  );
};

// ============= PIN CONFIRM DIALOG =============
interface PinConfirmModalProps {
  message: Message;
  onConfirm: (notify: boolean) => void;
  onCancel: () => void;
}

export const PinConfirmModal: React.FC<PinConfirmModalProps> = ({ message, onConfirm, onCancel }) => {
  const [notify, setNotify] = useState(true);
  return (
    <div className={MODAL_BACKDROP} onClick={onCancel}>
      <div className={`${MODAL_CARD} p-6 w-[380px]`} onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-foreground mb-2">{message.pinned ? 'Unpin Message?' : 'Pin Message?'}</h3>
        <p className="text-sm text-muted-foreground mb-4 truncate">{message.text.slice(0, 80)}</p>
        {!message.pinned && (
          <label className="flex items-center gap-2 text-sm text-foreground mb-4 cursor-pointer">
            <input type="checkbox" checked={notify} onChange={() => setNotify(!notify)} className="rounded border-border accent-primary" />
            Notify all members
          </label>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-dex-hover">Cancel</button>
          <button onClick={() => onConfirm(notify)} className="px-5 py-2 rounded-lg text-sm bg-primary text-primary-foreground">
            {message.pinned ? 'Unpin' : '📌 Pin'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============= REPORT DIALOG =============
interface ReportDialogProps {
  onReport: (reason: string) => void;
  onCancel: () => void;
}

export const ReportDialog: React.FC<ReportDialogProps> = ({ onReport, onCancel }) => {
  const [reason, setReason] = useState('');
  const reasons = ['Spam', 'Violence', 'Pornography', 'Harassment', 'Fake account', 'Other'];
  return (
    <div className={MODAL_BACKDROP} onClick={onCancel}>
      <div className={`${MODAL_CARD} p-6 w-[380px]`} onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-foreground mb-4">Report</h3>
        <div className="space-y-2 mb-4">
          {reasons.map(r => (
            <button key={r} onClick={() => setReason(r)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${reason === r ? 'bg-primary/10 border border-primary/30 text-foreground' : 'border border-border hover:bg-dex-hover text-foreground'}`}>
              {r}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-dex-hover">Cancel</button>
          <button disabled={!reason} onClick={() => onReport(reason)} className="px-5 py-2 rounded-lg text-sm bg-destructive text-destructive-foreground disabled:opacity-40">Report</button>
        </div>
      </div>
    </div>
  );
};

// ============= MUTE OPTIONS MODAL =============
interface MuteOptionsModalProps {
  onMute: (duration?: number) => void;
  onCancel: () => void;
}

export const MuteOptionsModal: React.FC<MuteOptionsModalProps> = ({ onMute, onCancel }) => {
  const options = [
    { label: '1 hour', seconds: 3600 },
    { label: '8 hours', seconds: 28800 },
    { label: '2 days', seconds: 172800 },
    { label: 'Forever', seconds: 0 },
  ];
  return (
    <div className={MODAL_BACKDROP} onClick={onCancel}>
      <div className={`${MODAL_CARD} p-6 w-[320px]`} onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-foreground mb-4">🔕 Mute for...</h3>
        <div className="space-y-2">
          {options.map(o => (
            <button key={o.label} onClick={() => onMute(o.seconds || undefined)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm hover:bg-dex-hover text-foreground transition-colors border border-border">
              {o.label}
            </button>
          ))}
        </div>
        <button onClick={onCancel} className="w-full mt-3 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-dex-hover">Cancel</button>
      </div>
    </div>
  );
};

// ============= SCHEDULE PICKER MODAL =============
interface SchedulePickerModalProps {
  onSchedule: (date: Date) => void;
  onCancel: () => void;
}

export const SchedulePickerModal: React.FC<SchedulePickerModalProps> = ({ onSchedule, onCancel }) => {
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [timeStr, setTimeStr] = useState('09:00');

  return (
    <div className={MODAL_BACKDROP} onClick={onCancel}>
      <div className={`${MODAL_CARD} p-6 w-[360px]`} onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-foreground mb-4">🕐 Schedule Message</h3>
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</label>
        <input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)}
          className="w-full mt-1 mb-3 px-3 py-2 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Time</label>
        <input type="time" value={timeStr} onChange={e => setTimeStr(e.target.value)}
          className="w-full mt-1 mb-4 px-3 py-2 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-dex-hover">Cancel</button>
          <button onClick={() => onSchedule(new Date(`${dateStr}T${timeStr}`))} className="px-5 py-2 rounded-lg text-sm bg-primary text-primary-foreground">Schedule</button>
        </div>
      </div>
    </div>
  );
};

// ============= FOLDER EDITOR MODAL =============
interface FolderEditorModalProps {
  chats: Chat[];
  onCreate: (name: string, emoji: string, chatIds: string[]) => void;
  onClose: () => void;
}

export const FolderEditorModal: React.FC<FolderEditorModalProps> = ({ chats, onCreate, onClose }) => {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📂');
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const emojis = ['📂', '👤', '👥', '📢', '🤖', '🎮', '💼', '🎓', '🏠', '❤️'];

  const toggleChat = (id: string) => {
    setSelectedChats(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  return (
    <div className={MODAL_BACKDROP} onClick={onClose}>
      <div className={`${MODAL_CARD} p-6 w-[420px] max-h-[550px] flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">New Folder</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-dex-hover text-muted-foreground"><X size={18} /></button>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1">
            {emojis.map(e => (
              <button key={e} onClick={() => setEmoji(e)} className={`text-lg p-1 rounded ${emoji === e ? 'bg-primary/20' : 'hover:bg-dex-hover'}`}>{e}</button>
            ))}
          </div>
        </div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Folder name"
          className="w-full mb-3 px-3 py-2 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Include chats</label>
        <div className="flex-1 overflow-y-auto space-y-1 mb-4">
          {chats.map(c => (
            <button key={c.id} onClick={() => toggleChat(c.id)}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors ${selectedChats.has(c.id) ? 'bg-primary/10 border border-primary/30' : 'hover:bg-dex-hover border border-transparent'}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ background: `hsl(${c.avatarColor})` }}>{c.avatar}</div>
              <span className="text-sm text-foreground flex-1 text-left">{c.name}</span>
              {selectedChats.has(c.id) && <span className="text-primary">✓</span>}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-dex-hover">Cancel</button>
          <button disabled={!name.trim()} onClick={() => onCreate(name, emoji, Array.from(selectedChats))}
            className="px-5 py-2 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-40">Create</button>
        </div>
      </div>
    </div>
  );
};

// ============= AUTO-DELETE DIALOG =============
interface AutoDeleteDialogProps {
  currentTimer: number;
  onSet: (timer: number) => void;
  onCancel: () => void;
}

export const AutoDeleteDialog: React.FC<AutoDeleteDialogProps> = ({ currentTimer, onSet, onCancel }) => {
  const options = [
    { label: 'Off', value: 0 },
    { label: '1 day', value: 86400 },
    { label: '1 week', value: 604800 },
    { label: '1 month', value: 2592000 },
  ];
  return (
    <div className={MODAL_BACKDROP} onClick={onCancel}>
      <div className={`${MODAL_CARD} p-6 w-[320px]`} onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-foreground mb-4">⏱️ Auto-delete Messages</h3>
        <div className="space-y-2">
          {options.map(o => (
            <button key={o.label} onClick={() => onSet(o.value)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors border ${currentTimer === o.value ? 'border-primary bg-primary/10 text-foreground' : 'border-border hover:bg-dex-hover text-foreground'}`}>
              {o.label}
            </button>
          ))}
        </div>
        <button onClick={onCancel} className="w-full mt-3 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-dex-hover">Cancel</button>
      </div>
    </div>
  );
};

// ============= EFFECT PICKER (unused as inline component, but exported for completeness) =============
export const EffectPickerMenu = () => null;

// ============= CLEAR HISTORY DIALOG =============
interface ClearHistoryDialogProps {
  chatName: string;
  chatType: ChatType;
  onConfirm: (forAll: boolean) => void;
  onCancel: () => void;
}

export const ClearHistoryDialog: React.FC<ClearHistoryDialogProps> = ({ chatName, chatType, onConfirm, onCancel }) => {
  const [forAll, setForAll] = useState(false);
  return (
    <div className={MODAL_BACKDROP} onClick={onCancel}>
      <div className={`${MODAL_CARD} p-6 w-[380px]`} onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-foreground mb-2">Clear History</h3>
        <p className="text-sm text-muted-foreground mb-4">Are you sure you want to delete all messages in <strong className="text-foreground">{chatName}</strong>?</p>
        {chatType === 'personal' && (
          <label className="flex items-center gap-2 text-sm text-foreground mb-4 cursor-pointer">
            <input type="checkbox" checked={forAll} onChange={() => setForAll(!forAll)} className="rounded border-border accent-primary" />
            Also delete for {chatName}
          </label>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-dex-hover transition-colors">Cancel</button>
          <button onClick={() => onConfirm(forAll)} className="px-4 py-2 rounded-lg text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">🗑️ Clear</button>
        </div>
      </div>
    </div>
  );
};

// ============= EDIT CHANNEL MODAL (Telegram-style Manage Channel) =============
interface EditChannelModalProps {
  chat: Chat;
  onSave: (settings: Partial<Chat>) => void;
  onClose: () => void;
  onOpenInviteLinks: () => void;
  onOpenAdmins: () => void;
  onDeleteChannel: () => void;
  onOpenBannedUsers?: () => void;
}

export const EditChannelModal: React.FC<EditChannelModalProps> = ({ chat, onSave, onClose, onOpenInviteLinks, onOpenAdmins, onDeleteChannel, onOpenBannedUsers }) => {
  const [name, setName] = useState(chat.name);
  const [description, setDescription] = useState(chat.description || '');
  const [isPublic, setIsPublic] = useState(chat.isPublic ?? true);
  const [commentsEnabled, setCommentsEnabled] = useState(chat.commentsEnabled ?? true);
  const [reactionsEnabled, setReactionsEnabled] = useState(chat.reactionsEnabled ?? true);
  const [signatureMode, setSignatureMode] = useState<SignatureMode>(chat.signatureMode ?? (chat.signMessages ? 'text' : 'anonymous'));
  const [autoTranslate, setAutoTranslate] = useState(chat.autoTranslate ?? false);
  const [directMessages, setDirectMessages] = useState(chat.directMessages ?? true);
  const [restrictedContent, setRestrictedContent] = useState(chat.restrictedContent ?? false);
  const [joinApproval, setJoinApproval] = useState(chat.joinApproval ?? false);
  const [joinToSend, setJoinToSend] = useState(chat.joinToSend ?? true);
  const [slowMode, setSlowMode] = useState(chat.slowMode ?? 0);
  const [participantsHidden, setParticipantsHidden] = useState(chat.participantsHidden ?? false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeSection, setActiveSection] = useState<'main' | 'permissions' | 'notifications'>('main');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarSelect = useCallback((file: File) => {
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const slowModeOptions = [
    { label: 'Off', value: 0 }, { label: '5s', value: 5 }, { label: '10s', value: 10 },
    { label: '15s', value: 15 }, { label: '30s', value: 30 },
    { label: '1m', value: 60 }, { label: '5m', value: 300 }, { label: '15m', value: 900 }, { label: '1h', value: 3600 },
  ];

  const handleSave = () => {
    onSave({
      name, description, isPublic, commentsEnabled, reactionsEnabled,
      signMessages: signatureMode !== 'anonymous', signatureMode,
      autoTranslate, directMessages, restrictedContent, joinApproval, joinToSend, slowMode,
      participantsHidden,
    });
  };

  return (
    <div className={MODAL_BACKDROP} onClick={onClose}>
      <div className={`${MODAL_CARD} p-0 w-[480px] max-h-[85vh] flex flex-col`} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h3 className="text-base font-semibold text-foreground">Manage Channel</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-dex-hover text-muted-foreground"><X size={18} /></button>
        </div>

        {/* Section tabs */}
        <div className="flex px-6 gap-1 mb-3">
          {[
            { key: 'main' as const, label: 'General' },
            { key: 'permissions' as const, label: 'Permissions' },
            { key: 'notifications' as const, label: 'Management' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveSection(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeSection === tab.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-dex-hover'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-5">
          {activeSection === 'main' && (
            <>
              {/* Avatar + Name */}
              <div className="flex items-center gap-4 mb-4">
                <AvatarUpload
                  avatarPreview={avatarPreview}
                  avatarUrl={chat.avatarUrl}
                  fallback={chat.avatar}
                  fallbackColor={chat.avatarColor}
                  size="sm"
                  onSelect={handleAvatarSelect}
                />
                <div className="flex-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Channel Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} maxLength={64}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={255}
                className="w-full mt-1 mb-4 px-3 py-2 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />

              {/* Channel type */}
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Channel Type</div>
              <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/50 border border-border mb-4">
                <div className="flex items-center gap-2">
                  {isPublic ? <Globe size={16} className="text-primary" /> : <Lock size={16} className="text-primary" />}
                  <div>
                    <span className="text-sm text-foreground">{isPublic ? 'Public' : 'Private'}</span>
                    <div className="text-[11px] text-muted-foreground">{isPublic ? 'Anyone can find and join' : 'Invite link only'}</div>
                  </div>
                </div>
                <button onClick={() => setIsPublic(!isPublic)}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary hover:bg-primary/25 transition-colors">
                  Change
                </button>
              </div>

              {/* Signature Mode (3-way) */}
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Post Signatures</div>
              <div className="space-y-1.5 mb-4">
                {([
                  { mode: 'anonymous' as SignatureMode, icon: <EyeOff size={15} />, label: 'Anonymous', desc: 'Posts show channel name only' },
                  { mode: 'text' as SignatureMode, icon: <Megaphone size={15} />, label: 'Text Signature', desc: 'Show admin name as non-clickable text' },
                  { mode: 'profile' as SignatureMode, icon: <Users size={15} />, label: 'Profile Signature', desc: 'Full sender info like group messages' },
                ]).map(opt => (
                  <button key={opt.mode} onClick={() => setSignatureMode(opt.mode)}
                    className={`flex items-center gap-3 w-full py-2.5 px-3 rounded-lg text-left transition-all ${signatureMode === opt.mode ? 'bg-primary/10 border border-primary/30' : 'border border-transparent hover:bg-dex-hover'}`}>
                    <span className={signatureMode === opt.mode ? 'text-primary' : 'text-muted-foreground'}>{opt.icon}</span>
                    <div>
                      <span className="text-sm text-foreground">{opt.label}</span>
                      <div className="text-[11px] text-muted-foreground">{opt.desc}</div>
                    </div>
                    {signatureMode === opt.mode && <span className="ml-auto text-primary text-sm">✓</span>}
                  </button>
                ))}
              </div>

              {/* Settings list */}
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Settings</div>
              <div className="space-y-0.5 mb-4">
                {[
                  { icon: <MessageSquare size={15} />, label: 'Allow Comments', desc: 'Enable discussion under posts', value: commentsEnabled, set: setCommentsEnabled },
                  { icon: <span className="text-sm">😊</span>, label: 'Allow Reactions', desc: 'Let subscribers react to posts', value: reactionsEnabled, set: setReactionsEnabled },
                  { icon: <Globe size={15} />, label: 'Auto-translate', desc: 'Translate messages for subscribers', value: autoTranslate, set: setAutoTranslate },
                  { icon: <Users size={15} />, label: 'Direct Messages', desc: 'Allow subscribers to DM the channel', value: directMessages, set: setDirectMessages },
                ].map(t => (
                  <div key={t.label} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-dex-hover transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="text-muted-foreground w-5 flex justify-center">{t.icon}</span>
                      <div>
                        <span className="text-sm text-foreground">{t.label}</span>
                        <div className="text-[11px] text-muted-foreground">{t.desc}</div>
                      </div>
                    </div>
                    <Toggle value={t.value} onChange={t.set} />
                  </div>
                ))}
              </div>
            </>
          )}

          {activeSection === 'permissions' && (
            <>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Content & Access</div>
              <div className="space-y-0.5 mb-4">
                <div className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-dex-hover">
                  <div className="flex items-center gap-2.5">
                    <EyeOff size={15} className="text-muted-foreground" />
                    <div>
                      <span className="text-sm text-foreground">Restrict Saving Content</span>
                      <div className="text-[11px] text-muted-foreground">Prevent forwarding, copying and saving</div>
                    </div>
                  </div>
                  <Toggle value={restrictedContent} onChange={setRestrictedContent} />
                </div>
                <div className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-dex-hover">
                  <div className="flex items-center gap-2.5">
                    <Shield size={15} className="text-muted-foreground" />
                    <div>
                      <span className="text-sm text-foreground">Join Approval</span>
                      <div className="text-[11px] text-muted-foreground">Review requests before accepting members</div>
                    </div>
                  </div>
                  <Toggle value={joinApproval} onChange={setJoinApproval} />
                </div>
                <div className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-dex-hover">
                  <div className="flex items-center gap-2.5">
                    <MessageSquare size={15} className="text-muted-foreground" />
                    <div>
                      <span className="text-sm text-foreground">Join to Send Messages</span>
                      <div className="text-[11px] text-muted-foreground">Only members can send in linked discussion</div>
                    </div>
                  </div>
                  <Toggle value={joinToSend} onChange={setJoinToSend} />
                </div>
                <div className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-dex-hover">
                  <div className="flex items-center gap-2.5">
                    <Eye size={15} className="text-muted-foreground" />
                    <div>
                      <span className="text-sm text-foreground">Hide Subscriber List</span>
                      <div className="text-[11px] text-muted-foreground">No one can see who is subscribed</div>
                    </div>
                  </div>
                  <Toggle value={participantsHidden} onChange={setParticipantsHidden} />
                </div>
              </div>

              {/* Slow mode - complete intervals */}
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Slow Mode (Discussion)</div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {slowModeOptions.map(o => (
                  <button key={o.value} onClick={() => setSlowMode(o.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${slowMode === o.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-dex-hover'}`}>
                    {o.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mb-4">
                {slowMode > 0 ? `Members can send one message every ${slowMode >= 3600 ? '1 hour' : slowMode >= 60 ? `${slowMode / 60} minute${slowMode > 60 ? 's' : ''}` : `${slowMode} seconds`}.` : 'Members can send messages without delay.'}
              </p>
            </>
          )}

          {activeSection === 'notifications' && (
            <>
              {/* Management links */}
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Management</div>
              <div className="space-y-0.5 mb-4">
                <button onClick={onOpenInviteLinks} className="flex items-center justify-between w-full py-3 px-3 rounded-lg hover:bg-dex-hover text-sm text-foreground transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Link size={16} className="text-primary" />
                    <span>Invite Links</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{(chat.inviteLinks || []).length} links</span>
                </button>
                <button onClick={onOpenAdmins} className="flex items-center justify-between w-full py-3 px-3 rounded-lg hover:bg-dex-hover text-sm text-foreground transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Crown size={16} className="text-amber-500" />
                    <span>Administrators</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{(chat.admins || []).length}</span>
                </button>
                <div className="flex items-center justify-between py-3 px-3 text-sm text-foreground">
                  <div className="flex items-center gap-2.5">
                    <Users size={16} className="text-muted-foreground" />
                    <span>Subscribers</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{chat.subscriberCount?.toLocaleString() || 0}</span>
                </div>
                {onOpenBannedUsers && (
                  <button onClick={onOpenBannedUsers} className="flex items-center justify-between w-full py-3 px-3 rounded-lg hover:bg-dex-hover text-sm text-foreground transition-colors">
                    <div className="flex items-center gap-2.5">
                      <Ban size={16} className="text-destructive" />
                      <span>Banned Users</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{(chat.bannedUsers || []).length}</span>
                  </button>
                )}
                {(chat.removedUsers || []).length > 0 && (
                  <div className="flex items-center justify-between py-3 px-3 text-sm text-foreground">
                    <div className="flex items-center gap-2.5">
                      <UserMinus size={16} className="text-muted-foreground" />
                      <span>Removed Users</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{chat.removedUsers!.length}</span>
                  </div>
                )}
              </div>

              {/* Recent actions log */}
              {chat.recentActions && chat.recentActions.length > 0 && (
                <>
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Actions</div>
                  <div className="space-y-1 mb-4 max-h-[150px] overflow-y-auto">
                    {chat.recentActions.slice(0, 10).map((a, i) => (
                      <div key={i} className="text-[11px] text-muted-foreground py-1.5 px-2 rounded bg-muted/30">
                        <span className="text-foreground">{a.userId}</span> {a.action}
                        <span className="ml-1 opacity-60">{a.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="h-px bg-border my-3" />

              {/* Danger zone */}
              <div className="text-[11px] font-semibold text-destructive/70 uppercase tracking-wider mb-2">Danger Zone</div>
              {!showDeleteConfirm ? (
                <button onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-2.5 px-3 rounded-lg text-sm text-destructive hover:bg-destructive/10 text-left transition-colors flex items-center gap-2">
                  <Trash2 size={15} /> Delete Channel
                </button>
              ) : (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                  <p className="text-sm text-destructive mb-3">This action cannot be undone. All messages and subscribers will be lost.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-dex-hover">Cancel</button>
                    <button onClick={onDeleteChannel} className="px-3 py-1.5 rounded-lg text-xs bg-destructive text-destructive-foreground">Delete Forever</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-dex-hover">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()} className="px-5 py-2 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-40 font-medium">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

// ============= EDIT GROUP MODAL (Telegram-style tabbed) =============
interface EditGroupModalProps {
  chat: Chat;
  onSave: (settings: Partial<Chat>) => void;
  onClose: () => void;
  onOpenInviteLinks: () => void;
  onOpenAdmins: () => void;
  onDeleteGroup: () => void;
  onOpenBannedUsers?: () => void;
  onOpenMemberRestrictions?: () => void;
}

export const EditGroupModal: React.FC<EditGroupModalProps> = ({ chat, onSave, onClose, onOpenInviteLinks, onOpenAdmins, onDeleteGroup, onOpenBannedUsers, onOpenMemberRestrictions }) => {
  const [name, setName] = useState(chat.name);
  const [description, setDescription] = useState(chat.bio || chat.description || '');
  const [isPublic, setIsPublic] = useState(chat.isPublic ?? false);
  const [chatHistory, setChatHistory] = useState(chat.chatHistoryForNewMembers ?? true);
  const [slowMode, setSlowMode] = useState(chat.slowMode ?? 0);
  const [reactionsEnabled, setReactionsEnabled] = useState(chat.reactionsEnabled ?? true);
  const [autoTranslate, setAutoTranslate] = useState(chat.autoTranslate ?? false);
  const [antiSpam, setAntiSpam] = useState(chat.antiSpam ?? false);
  const [restrictSaving, setRestrictSaving] = useState(chat.restrictSavingContent ?? false);
  const [joinApproval, setJoinApproval] = useState(chat.joinApproval ?? false);
  const [perms, setPerms] = useState<GroupPermissions>(chat.permissions ?? {
    sendMessages: true, sendMedia: true, sendStickers: true, sendPolls: true,
    sendLinks: true, sendFiles: true, addMembers: true, pinMessages: true, changeInfo: true, createTopics: false,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'permissions' | 'management'>('general');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarSelect = useCallback((file: File) => {
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const slowModeOptions = [
    { label: 'Off', value: 0 }, { label: '5s', value: 5 }, { label: '10s', value: 10 },
    { label: '15s', value: 15 }, { label: '30s', value: 30 }, { label: '1m', value: 60 },
    { label: '5m', value: 300 }, { label: '15m', value: 900 }, { label: '1h', value: 3600 },
  ];

  const togglePerm = (key: keyof GroupPermissions) => {
    setPerms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    onSave({
      name, bio: description, description, isPublic, chatHistoryForNewMembers: chatHistory,
      slowMode, permissions: perms, reactionsEnabled, autoTranslate, antiSpam,
      restrictSavingContent: restrictSaving, joinApproval,
    });
  };

  const bannedCount = Array.isArray(chat.bannedUsers) ? chat.bannedUsers.length : 0;

  return (
    <div className={MODAL_BACKDROP} onClick={onClose}>
      <div className={`${MODAL_CARD} p-0 w-[480px] max-h-[85vh] flex flex-col`} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h3 className="text-base font-semibold text-foreground">Manage Group</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-dex-hover text-muted-foreground"><X size={18} /></button>
        </div>

        {/* Tab bar */}
        <div className="flex px-6 gap-1 mb-3">
          {[
            { key: 'general' as const, label: 'General' },
            { key: 'permissions' as const, label: 'Permissions' },
            { key: 'management' as const, label: 'Management' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-dex-hover'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-5">
          {/* ===== GENERAL TAB ===== */}
          {activeTab === 'general' && (
            <>
              <div className="flex items-center gap-4 mb-4">
                <AvatarUpload
                  avatarPreview={avatarPreview}
                  avatarUrl={chat.avatarUrl}
                  fallback={chat.avatar}
                  fallbackColor={chat.avatarColor}
                  size="sm"
                  onSelect={handleAvatarSelect}
                />
                <div className="flex-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Group Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} maxLength={64}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={255}
                className="w-full mt-1 mb-4 px-3 py-2 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />

              {/* Group type */}
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Group Type</div>
              <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/50 border border-border mb-4">
                <div className="flex items-center gap-2">
                  {isPublic ? <Globe size={16} className="text-primary" /> : <Lock size={16} className="text-primary" />}
                  <div>
                    <span className="text-sm text-foreground">{isPublic ? 'Public' : 'Private'}</span>
                    <div className="text-[11px] text-muted-foreground">{isPublic ? 'Anyone can find and join' : 'Invite link only'}</div>
                  </div>
                </div>
                <button onClick={() => setIsPublic(!isPublic)}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary hover:bg-primary/25 transition-colors">
                  Change
                </button>
              </div>

              {isPublic && name.trim() && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                  <div className="flex items-start gap-2">
                    <Globe size={14} className="text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-foreground font-medium">Public link</p>
                      <p className="text-sm text-primary font-mono mt-0.5">https://dexst.me/{name.trim().toLowerCase().replace(/\s+/g, '')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings */}
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Settings</div>
              <div className="space-y-0.5 mb-4">
                {[
                  { icon: <Eye size={15} />, label: 'Chat History for New Members', desc: chatHistory ? 'New members can see old messages' : 'History hidden', value: chatHistory, set: setChatHistory },
                  { icon: <span className="text-sm">😊</span>, label: 'Allow Reactions', desc: 'Let members react to messages', value: reactionsEnabled, set: setReactionsEnabled },
                  { icon: <Globe size={15} />, label: 'Auto-translate', desc: 'Translate messages for members', value: autoTranslate, set: setAutoTranslate },
                ].map(t => (
                  <div key={t.label} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-dex-hover transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="text-muted-foreground w-5 flex justify-center">{t.icon}</span>
                      <div>
                        <span className="text-sm text-foreground">{t.label}</span>
                        <div className="text-[11px] text-muted-foreground">{t.desc}</div>
                      </div>
                    </div>
                    <Toggle value={t.value} onChange={t.set} />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ===== PERMISSIONS TAB ===== */}
          {activeTab === 'permissions' && (
            <>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Member Permissions</div>
              <div className="space-y-0.5 mb-4">
                {([
                  { key: 'sendMessages' as const, label: 'Send messages', icon: <MessageSquare size={15} /> },
                  { key: 'sendMedia' as const, label: 'Send media (photos/videos)', icon: <Image size={15} /> },
                  { key: 'sendStickers' as const, label: 'Send stickers/GIFs', icon: <span className="text-sm">🎨</span> },
                  { key: 'sendPolls' as const, label: 'Send polls', icon: <span className="text-sm">📊</span> },
                  { key: 'sendLinks' as const, label: 'Send links', icon: <Link size={15} /> },
                  { key: 'sendFiles' as const, label: 'Send files', icon: <span className="text-sm">📎</span> },
                  { key: 'addMembers' as const, label: 'Add members', icon: <Users size={15} /> },
                  { key: 'pinMessages' as const, label: 'Pin messages', icon: <span className="text-sm">📌</span> },
                  { key: 'changeInfo' as const, label: 'Change group info', icon: <Settings size={15} /> },
                  { key: 'createTopics' as const, label: 'Create topics', icon: <Hash size={15} /> },
                ]).map(p => (
                  <div key={p.key} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-dex-hover transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="text-muted-foreground w-5 flex justify-center">{p.icon}</span>
                      <span className="text-sm text-foreground">{p.label}</span>
                    </div>
                    <Toggle value={perms[p.key]} onChange={() => togglePerm(p.key)} />
                  </div>
                ))}
              </div>

              {/* Slow mode */}
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Slow Mode</div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {slowModeOptions.map(o => (
                  <button key={o.value} onClick={() => setSlowMode(o.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${slowMode === o.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-dex-hover'}`}>
                    {o.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mb-4">
                {slowMode > 0 ? `Members can send one message every ${slowMode >= 3600 ? '1 hour' : slowMode >= 60 ? `${slowMode / 60} minute${slowMode > 60 ? 's' : ''}` : `${slowMode} seconds`}. Admins are exempt.` : 'Members can send messages without delay.'}
              </p>

              <div className="h-px bg-border my-3" />

              {/* Additional restrictions */}
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Additional</div>
              <div className="space-y-0.5 mb-4">
                <div className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-dex-hover">
                  <div className="flex items-center gap-2.5">
                    <Shield size={15} className="text-muted-foreground" />
                    <div>
                      <span className="text-sm text-foreground">Anti-spam</span>
                      <div className="text-[11px] text-muted-foreground">Automatically remove spam messages</div>
                    </div>
                  </div>
                  <Toggle value={antiSpam} onChange={setAntiSpam} />
                </div>
                <div className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-dex-hover">
                  <div className="flex items-center gap-2.5">
                    <EyeOff size={15} className="text-muted-foreground" />
                    <div>
                      <span className="text-sm text-foreground">Restrict Saving Content</span>
                      <div className="text-[11px] text-muted-foreground">Prevent forwarding and saving of messages</div>
                    </div>
                  </div>
                  <Toggle value={restrictSaving} onChange={setRestrictSaving} />
                </div>
                {isPublic && (
                  <div className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-dex-hover">
                    <div className="flex items-center gap-2.5">
                      <Shield size={15} className="text-muted-foreground" />
                      <div>
                        <span className="text-sm text-foreground">Join Approval</span>
                        <div className="text-[11px] text-muted-foreground">Review requests before accepting members</div>
                      </div>
                    </div>
                    <Toggle value={joinApproval} onChange={setJoinApproval} />
                  </div>
                )}
              </div>
            </>
          )}

          {/* ===== MANAGEMENT TAB ===== */}
          {activeTab === 'management' && (
            <>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Management</div>
              <div className="space-y-0.5 mb-4">
                <button onClick={onOpenInviteLinks} className="flex items-center justify-between w-full py-3 px-3 rounded-lg hover:bg-dex-hover text-sm text-foreground transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Link size={16} className="text-primary" />
                    <span>Invite Links</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">{(chat.inviteLinks || []).length} links</span>
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </div>
                </button>
                <button onClick={onOpenAdmins} className="flex items-center justify-between w-full py-3 px-3 rounded-lg hover:bg-dex-hover text-sm text-foreground transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Crown size={16} className="text-amber-500" />
                    <span>Administrators</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">{(chat.admins || []).length}</span>
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </div>
                </button>
                <div className="flex items-center justify-between py-3 px-3 text-sm text-foreground">
                  <div className="flex items-center gap-2.5">
                    <Users size={16} className="text-muted-foreground" />
                    <span>Members</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{chat.memberCount || chat.members?.length || 0}</span>
                </div>
                {onOpenMemberRestrictions && (
                  <button onClick={onOpenMemberRestrictions} className="flex items-center justify-between w-full py-3 px-3 rounded-lg hover:bg-dex-hover text-sm text-foreground transition-colors">
                    <div className="flex items-center gap-2.5">
                      <UserMinus size={16} className="text-muted-foreground" />
                      <span>Member Restrictions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">{(chat.memberRestrictions || []).length}</span>
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </div>
                  </button>
                )}
                {onOpenBannedUsers && (
                  <button onClick={onOpenBannedUsers} className="flex items-center justify-between w-full py-3 px-3 rounded-lg hover:bg-dex-hover text-sm text-foreground transition-colors">
                    <div className="flex items-center gap-2.5">
                      <Ban size={16} className="text-destructive" />
                      <span>Banned Users</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">{bannedCount}</span>
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </div>
                  </button>
                )}
                {chat.removedUsers && chat.removedUsers.length > 0 && (
                  <div className="flex items-center justify-between py-3 px-3 text-sm text-foreground">
                    <div className="flex items-center gap-2.5">
                      <UserMinus size={16} className="text-muted-foreground" />
                      <span>Removed Users</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{chat.removedUsers.length}</span>
                  </div>
                )}
              </div>

              {/* Recent actions log */}
              {chat.recentActions && chat.recentActions.length > 0 && (
                <>
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Actions</div>
                  <div className="space-y-1 mb-4 max-h-[150px] overflow-y-auto">
                    {chat.recentActions.slice(0, 10).map((a, i) => (
                      <div key={i} className="text-[11px] text-muted-foreground py-1.5 px-2 rounded bg-muted/30">
                        <span className="text-foreground">{a.userId}</span> {a.action}
                        <span className="ml-1 opacity-60">{a.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="h-px bg-border my-3" />

              {/* Danger zone */}
              <div className="text-[11px] font-semibold text-destructive/70 uppercase tracking-wider mb-2">Danger Zone</div>
              {!showDeleteConfirm ? (
                <button onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-2.5 px-3 rounded-lg text-sm text-destructive hover:bg-destructive/10 text-left transition-colors flex items-center gap-2">
                  <Trash2 size={15} /> Delete Group
                </button>
              ) : (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                  <p className="text-sm text-destructive mb-3">This action cannot be undone. All messages and members will be removed.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-dex-hover">Cancel</button>
                    <button onClick={onDeleteGroup} className="px-3 py-1.5 rounded-lg text-xs bg-destructive text-destructive-foreground">Delete Forever</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-dex-hover">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()} className="px-5 py-2 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-40 font-medium">Save Changes</button>
        </div>
      </div>
    </div>
  );
};
interface InviteLinksModalProps {
  inviteLinks: InviteLink[];
  onCreate: () => void;
  onRevoke: (linkId: string) => void;
  onClose: () => void;
}

export const InviteLinksModal: React.FC<InviteLinksModalProps> = ({ inviteLinks, onCreate, onRevoke, onClose }) => {
  const formatLink = (link: string) => {
    // If it's already a dexst.me link, show as-is; otherwise prefix
    if (link.startsWith('https://dexst.me/')) return link;
    return `https://dexst.me/+${link.replace(/.*\//, '')}`;
  };

  return (
    <div className={MODAL_BACKDROP} onClick={onClose}>
      <div className={`${MODAL_CARD} p-6 w-[420px] max-h-[500px] flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">🔗 Invite Links</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-dex-hover text-muted-foreground"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {inviteLinks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No invite links yet</p>
          )}
          {inviteLinks.map((link, i) => (
            <div key={link.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-foreground font-mono truncate">{formatLink(link.link)}</p>
                  {i === 0 && <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/15 text-primary flex-shrink-0">Primary</span>}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {link.uses} uses{link.maxUses ? ` / ${link.maxUses} max` : ''}
                  {link.expiresAt ? ` · Expires ${link.expiresAt}` : ''}
                </p>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(formatLink(link.link)); }} className="p-1.5 rounded-lg hover:bg-dex-hover text-muted-foreground" title="Copy">
                <Copy size={14} />
              </button>
              <button onClick={() => onRevoke(link.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive" title="Revoke">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <button onClick={onCreate} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus size={16} /> Create New Link
        </button>
      </div>
    </div>
  );
};

// ============= ADMIN MANAGEMENT MODAL (Enhanced with per-admin permissions) =============
const DEFAULT_ADMIN_PERMS: AdminPermissions = {
  changeInfo: true, postMessages: true, editMessages: true, deleteMessages: true,
  banUsers: true, inviteUsers: true, pinMessages: true, manageVideoChats: false,
  stayAnonymous: false, addAdmins: false, manageTopics: false, postStories: false,
};

interface AdminManagementModalProps {
  chat: Chat;
  users: User[];
  currentUserId?: string;
  onPromote: (userId: string, title: string, permissions?: AdminPermissions) => void;
  onDemote: (userId: string) => void;
  onClose: () => void;
}

export const AdminManagementModal: React.FC<AdminManagementModalProps> = ({ chat, users: allUsers, currentUserId, onPromote, onDemote, onClose }) => {
  const [showPromote, setShowPromote] = useState(false);
  const [promoteUserId, setPromoteUserId] = useState('');
  const [promoteTitle, setPromoteTitle] = useState('');
  const [promotePerms, setPromotePerms] = useState<AdminPermissions>({ ...DEFAULT_ADMIN_PERMS });
  const [editingAdmin, setEditingAdmin] = useState<string | null>(null);
  const [editPerms, setEditPerms] = useState<AdminPermissions>({ ...DEFAULT_ADMIN_PERMS });
  const [editTitle, setEditTitle] = useState('');

  const admins = chat.admins || [];
  const members = chat.members || [];
  const nonAdminMembers = members.filter(m => !admins.find(a => a.userId === m.id));

  const getUserInfo = (userId: string) => {
    return allUsers.find(u => u.id === userId) || members.find(m => m.id === userId);
  };

  const isCurrentUser = (userId: string) => userId === currentUserId;

  const adminPermLabels: { key: keyof AdminPermissions; label: string }[] = [
    { key: 'changeInfo', label: 'Change channel/group info' },
    { key: 'postMessages', label: 'Post messages' },
    { key: 'editMessages', label: 'Edit messages of others' },
    { key: 'deleteMessages', label: 'Delete messages' },
    { key: 'banUsers', label: 'Ban users' },
    { key: 'inviteUsers', label: 'Invite users via link' },
    { key: 'pinMessages', label: 'Pin messages' },
    { key: 'manageVideoChats', label: 'Manage voice/video chats' },
    { key: 'stayAnonymous', label: 'Stay anonymous' },
    { key: 'addAdmins', label: 'Add new admins' },
    { key: 'manageTopics', label: 'Manage topics' },
    { key: 'postStories', label: 'Post stories' },
  ];

  const startEditAdmin = (admin: AdminEntry) => {
    setEditingAdmin(admin.userId);
    setEditPerms({ ...DEFAULT_ADMIN_PERMS, ...admin.permissions });
    setEditTitle(admin.title || '');
  };

  return (
    <div className={MODAL_BACKDROP} onClick={onClose}>
      <div className={`${MODAL_CARD} p-6 w-[440px] max-h-[700px] flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">👑 Administrators ({admins.length})</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-dex-hover text-muted-foreground"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 mb-4">
          {admins.map(admin => {
            const user = getUserInfo(admin.userId);
            const isEditing = editingAdmin === admin.userId;
            return (
              <div key={admin.userId}>
                <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-dex-hover transition-colors">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ background: `hsl(${user?.color || '252 75% 64%'})` }}>
                    {user?.avatar || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground">{user?.name || admin.userId}</span>
                      {isCurrentUser(admin.userId) && <Crown size={12} className="text-amber-500" />}
                    </div>
                    {admin.title && <span className="text-[11px] text-primary">{admin.title}</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    {!isCurrentUser(admin.userId) && (
                      <>
                        <button onClick={() => isEditing ? setEditingAdmin(null) : startEditAdmin(admin)}
                          className="px-2 py-1 rounded text-xs text-primary hover:bg-primary/10 transition-colors">
                          {isEditing ? 'Close' : 'Edit'}
                        </button>
                        <button onClick={() => onDemote(admin.userId)} className="px-2 py-1 rounded text-xs text-destructive hover:bg-destructive/10 transition-colors">
                          Demote
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {/* Inline permissions editor */}
                {isEditing && (
                  <div className="ml-12 mr-2 mb-2 p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Custom title (e.g. Moderator)"
                      className="w-full px-3 py-1.5 rounded-lg bg-muted text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                    {adminPermLabels.map(p => (
                      <div key={p.key} className="flex items-center justify-between py-1">
                        <span className="text-xs text-foreground">{p.label}</span>
                        <Toggle value={editPerms[p.key]} onChange={(v) => setEditPerms(prev => ({ ...prev, [p.key]: v }))} />
                      </div>
                    ))}
                    <button onClick={() => { onPromote(admin.userId, editTitle, editPerms); setEditingAdmin(null); }}
                      className="w-full py-1.5 rounded-lg text-xs bg-primary text-primary-foreground">Save Permissions</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!showPromote ? (
          <button onClick={() => setShowPromote(true)} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus size={16} /> Add Administrator
          </button>
        ) : (
          <div className="border border-border rounded-lg p-3 space-y-3 max-h-[400px] overflow-y-auto">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select member to promote</div>
            <div className="max-h-[120px] overflow-y-auto space-y-1">
              {nonAdminMembers.map(m => (
                <button key={m.id} onClick={() => setPromoteUserId(m.id)}
                  className={`flex items-center gap-2 w-full px-2 py-2 rounded-lg transition-colors ${promoteUserId === m.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-dex-hover'}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ background: `hsl(${m.color})` }}>{m.avatar}</div>
                  <span className="text-sm text-foreground">{m.name}</span>
                  {promoteUserId === m.id && <span className="ml-auto text-primary">✓</span>}
                </button>
              ))}
              {nonAdminMembers.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">All members are admins</p>}
            </div>
            <input value={promoteTitle} onChange={e => setPromoteTitle(e.target.value)} placeholder="Custom title (e.g. Moderator)" className="w-full px-3 py-2 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Permissions</div>
            {adminPermLabels.map(p => (
              <div key={p.key} className="flex items-center justify-between py-1">
                <span className="text-xs text-foreground">{p.label}</span>
                <Toggle value={promotePerms[p.key]} onChange={(v) => setPromotePerms(prev => ({ ...prev, [p.key]: v }))} />
              </div>
            ))}

            <div className="flex gap-2">
              <button onClick={() => { setShowPromote(false); setPromoteUserId(''); setPromoteTitle(''); setPromotePerms({ ...DEFAULT_ADMIN_PERMS }); }} className="flex-1 py-2 rounded-lg text-sm text-muted-foreground hover:bg-dex-hover">Cancel</button>
              <button disabled={!promoteUserId} onClick={() => { onPromote(promoteUserId, promoteTitle, promotePerms); setShowPromote(false); setPromoteUserId(''); setPromoteTitle(''); setPromotePerms({ ...DEFAULT_ADMIN_PERMS }); }}
                className="flex-1 py-2 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-40">Promote</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============= BANNED USERS MODAL =============
interface BannedUsersModalProps {
  bannedUsers: BannedUserEntry[];
  users: User[];
  onUnban: (userId: string) => void;
  onClose: () => void;
}

export const BannedUsersModal: React.FC<BannedUsersModalProps> = ({ bannedUsers, users, onUnban, onClose }) => {
  const getUserInfo = (userId: string) => users.find(u => u.id === userId);

  return (
    <div className={MODAL_BACKDROP} onClick={onClose}>
      <div className={`${MODAL_CARD} p-6 w-[420px] max-h-[500px] flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">🚫 Banned Users ({bannedUsers.length})</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-dex-hover text-muted-foreground"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1">
          {bannedUsers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No banned users</p>
          )}
          {bannedUsers.map(ban => {
            const user = getUserInfo(ban.userId);
            const isPermanent = !ban.until;
            return (
              <div key={ban.userId} className="flex items-center gap-3 p-3 rounded-lg hover:bg-dex-hover transition-colors">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white bg-destructive/20 text-destructive">
                  {user?.avatar || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">{user?.name || ban.userId}</span>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    {ban.reason && <span>{ban.reason}</span>}
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${isPermanent ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-500'}`}>
                      {isPermanent ? 'Permanent' : `Until ${new Date(ban.until!).toLocaleDateString()}`}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{ban.bannedAt}</p>
                </div>
                <button onClick={() => onUnban(ban.userId)} className="px-3 py-1.5 rounded-lg text-xs text-primary hover:bg-primary/10 transition-colors">
                  Unban
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============= MEMBER RESTRICTIONS MODAL =============
interface MemberRestrictionsModalProps {
  chat: Chat;
  users: User[];
  onSave: (restrictions: MemberRestriction[]) => void;
  onClose: () => void;
}

export const MemberRestrictionsModal: React.FC<MemberRestrictionsModalProps> = ({ chat, users, onSave, onClose }) => {
  const [restrictions, setRestrictions] = useState<MemberRestriction[]>(chat.memberRestrictions || []);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const members = chat.members || [];

  const permLabels: { key: keyof GroupPermissions; label: string }[] = [
    { key: 'sendMessages', label: 'Send messages' },
    { key: 'sendMedia', label: 'Send media' },
    { key: 'sendStickers', label: 'Send stickers/GIFs' },
    { key: 'sendPolls', label: 'Send polls' },
    { key: 'sendLinks', label: 'Send links' },
    { key: 'sendFiles', label: 'Send files' },
    { key: 'addMembers', label: 'Add members' },
    { key: 'pinMessages', label: 'Pin messages' },
    { key: 'changeInfo', label: 'Change group info' },
    { key: 'createTopics', label: 'Create topics' },
  ];

  const durationOptions = [
    { label: '1 hour', value: 3600 },
    { label: '1 day', value: 86400 },
    { label: '1 week', value: 604800 },
    { label: 'Forever', value: 0 },
  ];

  const getUserRestriction = (userId: string) => restrictions.find(r => r.userId === userId);

  const toggleRestriction = (userId: string, key: keyof GroupPermissions) => {
    setRestrictions(prev => {
      const existing = prev.find(r => r.userId === userId);
      if (existing) {
        const newRestrictions = { ...existing.restrictions };
        if (newRestrictions[key] === false) {
          delete newRestrictions[key];
        } else {
          newRestrictions[key] = false;
        }
        if (Object.keys(newRestrictions).length === 0) {
          return prev.filter(r => r.userId !== userId);
        }
        return prev.map(r => r.userId === userId ? { ...r, restrictions: newRestrictions } : r);
      } else {
        return [...prev, { userId, restrictions: { [key]: false } }];
      }
    });
  };

  const setDuration = (userId: string, duration: number) => {
    setRestrictions(prev => prev.map(r =>
      r.userId === userId ? { ...r, until: duration > 0 ? Date.now() + duration * 1000 : undefined } : r
    ));
  };

  const getUserInfo = (userId: string) => users.find(u => u.id === userId) || members.find(m => m.id === userId);

  return (
    <div className={MODAL_BACKDROP} onClick={onClose}>
      <div className={`${MODAL_CARD} p-6 w-[440px] max-h-[700px] flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">👤 Member Restrictions</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-dex-hover text-muted-foreground"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 mb-4">
          {members.map(m => {
            const restriction = getUserRestriction(m.id);
            const isSelected = selectedUser === m.id;
            const restrictedCount = restriction ? Object.keys(restriction.restrictions).length : 0;
            return (
              <div key={m.id}>
                <button onClick={() => setSelectedUser(isSelected ? null : m.id)}
                  className={`flex items-center gap-3 w-full p-2.5 rounded-lg transition-colors ${isSelected ? 'bg-primary/5 border border-primary/20' : 'hover:bg-dex-hover'}`}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ background: `hsl(${m.color})` }}>
                    {m.avatar}
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm text-foreground">{m.name}</span>
                    {restrictedCount > 0 && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500">{restrictedCount} restricted</span>
                    )}
                  </div>
                  <ChevronRight size={14} className={`text-muted-foreground transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                </button>
                {isSelected && (
                  <div className="ml-12 mr-2 mb-2 p-3 rounded-lg border border-border bg-muted/20 space-y-1.5">
                    {permLabels.map(p => {
                      const isRestricted = restriction?.restrictions[p.key] === false;
                      return (
                        <div key={p.key} className="flex items-center justify-between py-1">
                          <span className="text-xs text-foreground">{p.label}</span>
                          <Toggle value={!isRestricted} onChange={() => toggleRestriction(m.id, p.key)} />
                        </div>
                      );
                    })}
                    {restriction && (
                      <>
                        <div className="h-px bg-border my-2" />
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Duration</div>
                        <div className="flex flex-wrap gap-1">
                          {durationOptions.map(d => (
                            <button key={d.label} onClick={() => setDuration(m.id, d.value)}
                              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                                (d.value === 0 && !restriction.until) || (d.value > 0 && restriction.until && Math.abs(restriction.until - Date.now() - d.value * 1000) < 60000)
                                  ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-dex-hover'
                              }`}>
                              {d.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {members.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No members</p>}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-dex-hover">Cancel</button>
          <button onClick={() => { onSave(restrictions); onClose(); }} className="px-5 py-2 rounded-lg text-sm bg-primary text-primary-foreground font-medium">Save</button>
        </div>
      </div>
    </div>
  );
};
interface LeaveConfirmDialogProps {
  chatName: string;
  chatType: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LeaveConfirmDialog: React.FC<LeaveConfirmDialogProps> = ({ chatName, chatType, onConfirm, onCancel }) => {
  const typeLabel = chatType === 'channel' ? 'channel' : 'group';
  return (
    <div className={MODAL_BACKDROP} onClick={onCancel}>
      <div className={`${MODAL_CARD} p-6 w-[380px]`} onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-foreground mb-2">Leave {typeLabel}?</h3>
        <p className="text-sm text-muted-foreground mb-4">Are you sure you want to leave <strong className="text-foreground">{chatName}</strong>? You won't be able to see new messages unless you rejoin.</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-dex-hover transition-colors">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">Leave</button>
        </div>
      </div>
    </div>
  );
};

// ============= NEW CHAT MODAL (DM) =============
interface NewChatModalProps {
  onClose: () => void;
  onStartChat: (userId: number) => void;
  onSelectRecent?: (chatId: string) => void;
  recentContacts?: { id: string; name: string; avatar: string; avatarColor: string; online?: boolean }[];
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ onClose, onStartChat, onSelectRecent, recentContacts }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults, isLoading: isSearching } = useUserSearch(searchQuery);

  return (
    <div className={MODAL_BACKDROP} onClick={onClose}>
      <div className={`${MODAL_CARD} p-6 w-[420px] max-h-[500px] flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">New Chat</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-dex-hover text-muted-foreground"><X size={18} /></button>
        </div>
        <input
          autoFocus
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search users..."
          className="w-full mb-3 px-3 py-2 rounded-lg bg-muted text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
        />

        {/* Recent contacts — shown when no search query */}
        {searchQuery.length < 2 && recentContacts && recentContacts.length > 0 && (
          <div className="mb-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent</p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
              {recentContacts.map(c => (
                <button key={c.id} onClick={() => { if (onSelectRecent) { onSelectRecent(c.id); } else { onStartChat(Number(c.id)); } }}
                  className="flex flex-col items-center gap-1.5 min-w-[60px] group">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold text-white transition-transform group-hover:scale-105"
                      style={{ background: `hsl(${c.avatarColor})` }}>
                      {c.avatar}
                    </div>
                    {c.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-dex-online border-2 border-card" />
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate w-full text-center">{c.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-1 min-h-[120px]">
          {isSearching && <p className="text-xs text-muted-foreground text-center py-3">Searching...</p>}
          {searchQuery.length < 2 && !isSearching && !recentContacts?.length && (
            <p className="text-xs text-muted-foreground text-center py-3">Type at least 2 characters to search</p>
          )}
          {searchResults?.map(u => (
            <button key={u.id} onClick={() => onStartChat(u.id)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-dex-hover transition-colors border border-transparent">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                  style={{ background: `hsl(${(u.id * 137) % 360} 65% 55%)` }}>
                  {(u.displayName || u.username).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                {u.isOnline && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-dex-online border-2 border-card" />
                )}
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-medium text-foreground">{u.displayName || u.username}</span>
                <p className="text-[11px] text-muted-foreground">@{u.username}</p>
              </div>
            </button>
          ))}
          {searchResults?.length === 0 && searchQuery.length >= 2 && !isSearching && (
            <p className="text-xs text-muted-foreground text-center py-3">No users found</p>
          )}
        </div>
      </div>
    </div>
  );
};
