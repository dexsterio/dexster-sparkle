import React, { useState } from 'react';
import { Chat, Message } from '@/types/chat';
import { X } from 'lucide-react';

interface DeleteDialogProps {
  message: Message;
  chatName: string;
  onConfirm: (forAll: boolean) => void;
  onCancel: () => void;
}

export const DeleteDialog: React.FC<DeleteDialogProps> = ({ message, chatName, onConfirm, onCancel }) => {
  const [forAll, setForAll] = useState(false);
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-[fadeIn_0.15s_ease-out]" onClick={onCancel}>
      <div className="bg-card rounded-2xl p-6 w-[380px] shadow-2xl animate-[modalIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
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

interface ForwardModalProps {
  chats: Chat[];
  onForward: (chatId: string) => void;
  onCancel: () => void;
}

export const ForwardModal: React.FC<ForwardModalProps> = ({ chats, onForward, onCancel }) => {
  const [search, setSearch] = useState('');
  const filtered = chats.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-[fadeIn_0.15s_ease-out]" onClick={onCancel}>
      <div className="bg-card rounded-2xl p-5 w-[400px] max-h-[500px] flex flex-col shadow-2xl animate-[modalIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-foreground">Forward to...</h3>
          <button onClick={onCancel} className="p-1 rounded hover:bg-dex-hover text-muted-foreground"><X size={18} /></button>
        </div>
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full px-3 py-2 rounded-full bg-muted text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary mb-3"
        />
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

interface CreateChannelModalProps {
  onClose: () => void;
  onCreate: (name: string, description: string, isPublic: boolean, comments: boolean, reactions: boolean) => void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ onClose, onCreate }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [comments, setComments] = useState(true);
  const [reactions, setReactions] = useState(true);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-[fadeIn_0.15s_ease-out]" onClick={onClose}>
      <div className="bg-card rounded-2xl p-6 w-[420px] shadow-2xl animate-[modalIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">{step === 1 ? 'New Channel' : 'Channel Settings'}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-dex-hover text-muted-foreground"><X size={18} /></button>
        </div>

        {step === 1 ? (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-2xl text-muted-foreground/30">📷</div>
            </div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Channel Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 mb-3 px-3 py-2 rounded-lg bg-muted text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Channel name" />
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full mt-1 px-3 py-2 rounded-lg bg-muted text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none" placeholder="Optional description" />
            <div className="flex justify-end mt-4">
              <button disabled={!name.trim()} onClick={() => setStep(2)} className="px-5 py-2 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-40 transition-opacity">Next</button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              <div className="flex gap-2">
                {[{ pub: true, icon: '🌐', label: 'Public', desc: 'Anyone can find and join' }, { pub: false, icon: '🔒', label: 'Private', desc: 'Only via invite link' }].map(opt => (
                  <button key={String(opt.pub)} onClick={() => setIsPublic(opt.pub)} className={`flex-1 p-3 rounded-xl border text-left transition-colors ${isPublic === opt.pub ? 'border-primary bg-primary/10' : 'border-border hover:bg-dex-hover'}`}>
                    <div className="text-lg mb-1">{opt.icon}</div>
                    <div className="text-sm font-semibold text-foreground">{opt.label}</div>
                    <div className="text-[11px] text-muted-foreground">{opt.desc}</div>
                  </button>
                ))}
              </div>

              {[{ label: 'Allow Comments', value: comments, set: setComments }, { label: 'Allow Reactions', value: reactions, set: setReactions }].map(t => (
                <div key={t.label} className="flex items-center justify-between py-2">
                  <span className="text-sm text-foreground">{t.label}</span>
                  <button onClick={() => t.set(!t.value)} className={`w-9 h-5 rounded-full transition-colors ${t.value ? 'bg-primary' : 'bg-muted'} flex items-center ${t.value ? 'justify-end' : 'justify-start'} px-0.5`}>
                    <div className="w-4 h-4 rounded-full bg-white transition-all" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-dex-hover transition-colors">Back</button>
              <button onClick={() => onCreate(name, description, isPublic, comments, reactions)} className="px-5 py-2 rounded-lg text-sm bg-primary text-primary-foreground">Create Channel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
