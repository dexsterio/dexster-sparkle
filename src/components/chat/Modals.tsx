import React, { useState } from 'react';
import { Chat, Message, ChatType, GroupPermissions, InviteLink, AdminEntry, User } from '@/types/chat';
import { X, Copy, Trash2, Plus, Shield, Crown, Link } from 'lucide-react';
import { users } from '@/data/mockData';

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

// ============= CREATE CHANNEL MODAL =============
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
    <div className={MODAL_BACKDROP} onClick={onClose}>
      <div className={`${MODAL_CARD} p-6 w-[420px]`} onClick={e => e.stopPropagation()}>
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

// ============= CREATE GROUP MODAL =============
interface CreateGroupModalProps {
  onClose: () => void;
  onCreate: (name: string, memberIds: string[], description: string) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const allUsers = Object.values(users);

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className={MODAL_BACKDROP} onClick={onClose}>
      <div className={`${MODAL_CARD} p-6 w-[420px] max-h-[550px] flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">New Group</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-dex-hover text-muted-foreground"><X size={18} /></button>
        </div>
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Group Name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 mb-3 px-3 py-2 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Group name" />
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
        <input value={description} onChange={e => setDescription(e.target.value)} className="w-full mt-1 mb-3 px-3 py-2 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Optional" />
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Add Members ({selectedMembers.size})</label>
        <div className="flex-1 overflow-y-auto space-y-1 mb-4">
          {allUsers.map(u => (
            <button key={u.id} onClick={() => toggleMember(u.id)}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors ${selectedMembers.has(u.id) ? 'bg-primary/10 border border-primary/30' : 'hover:bg-dex-hover border border-transparent'}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ background: `hsl(${u.color})` }}>{u.avatar}</div>
              <span className="text-sm text-foreground flex-1 text-left">{u.name}</span>
              {selectedMembers.has(u.id) && <span className="text-primary">✓</span>}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-dex-hover">Cancel</button>
          <button disabled={!name.trim() || selectedMembers.size === 0} onClick={() => onCreate(name, Array.from(selectedMembers), description)}
            className="px-5 py-2 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-40">Create Group</button>
        </div>
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
  const [dateStr, setDateStr] = useState('2026-02-11');
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

// ============= EDIT CHANNEL MODAL =============
interface EditChannelModalProps {
  chat: Chat;
  onSave: (settings: Partial<Chat>) => void;
  onClose: () => void;
  onOpenInviteLinks: () => void;
  onOpenAdmins: () => void;
  onDeleteChannel: () => void;
}

export const EditChannelModal: React.FC<EditChannelModalProps> = ({ chat, onSave, onClose, onOpenInviteLinks, onOpenAdmins, onDeleteChannel }) => {
  const [name, setName] = useState(chat.name);
  const [description, setDescription] = useState(chat.description || '');
  const [isPublic, setIsPublic] = useState(chat.isPublic ?? true);
  const [commentsEnabled, setCommentsEnabled] = useState(chat.commentsEnabled ?? true);
  const [reactionsEnabled, setReactionsEnabled] = useState(chat.reactionsEnabled ?? true);
  const [signMessages, setSignMessages] = useState(chat.signMessages ?? false);
  const [autoTranslate, setAutoTranslate] = useState(chat.autoTranslate ?? false);
  const [directMessages, setDirectMessages] = useState(chat.directMessages ?? true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    onSave({ name, description, isPublic, commentsEnabled, reactionsEnabled, signMessages, autoTranslate, directMessages });
  };

  return (
    <div className={MODAL_BACKDROP} onClick={onClose}>
      <div className={`${MODAL_CARD} p-6 w-[460px] max-h-[85vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-foreground">Edit Channel</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-dex-hover text-muted-foreground"><X size={18} /></button>
        </div>

        {/* Avatar & Name */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0" style={{ background: `hsl(${chat.avatarColor})` }}>
            {chat.avatar}
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Channel Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full mt-1 mb-4 px-3 py-2 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />

        {/* Settings */}
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Settings</div>
        <div className="space-y-1 mb-4">
          <div className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-dex-hover">
            <div><span className="text-sm text-foreground">Channel type</span><div className="text-[11px] text-muted-foreground">{isPublic ? 'Public — anyone can find' : 'Private — invite only'}</div></div>
            <button onClick={() => setIsPublic(!isPublic)} className={`px-3 py-1 rounded-full text-xs font-medium ${isPublic ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {isPublic ? '🌐 Public' : '🔒 Private'}
            </button>
          </div>
          {[
            { label: 'Direct Messages', desc: 'Allow users to DM each other', value: directMessages, set: setDirectMessages },
            { label: 'Sign Messages', desc: 'Show admin name on posts', value: signMessages, set: setSignMessages },
            { label: 'Auto-translate', desc: 'Translate messages for subscribers', value: autoTranslate, set: setAutoTranslate },
            { label: 'Allow Comments', desc: 'Enable discussion under posts', value: commentsEnabled, set: setCommentsEnabled },
            { label: 'Allow Reactions', desc: 'Let subscribers react to posts', value: reactionsEnabled, set: setReactionsEnabled },
          ].map(t => (
            <div key={t.label} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-dex-hover">
              <div><span className="text-sm text-foreground">{t.label}</span><div className="text-[11px] text-muted-foreground">{t.desc}</div></div>
              <button onClick={() => t.set(!t.value)} className={`w-10 h-5.5 rounded-full transition-colors ${t.value ? 'bg-primary' : 'bg-muted'} flex items-center ${t.value ? 'justify-end' : 'justify-start'} px-0.5`}>
                <div className="w-4.5 h-4.5 rounded-full bg-white transition-all" />
              </button>
            </div>
          ))}
        </div>

        <div className="h-px bg-border my-3" />

        {/* Management */}
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Management</div>
        <div className="space-y-0.5 mb-4">
          <button onClick={onOpenInviteLinks} className="flex items-center justify-between w-full py-2.5 px-2 rounded-lg hover:bg-dex-hover text-sm text-foreground">
            <div className="flex items-center gap-2"><Link size={16} /> Invite links</div>
            <span className="text-xs text-muted-foreground">{(chat.inviteLinks || []).length}</span>
          </button>
          <button onClick={onOpenAdmins} className="flex items-center justify-between w-full py-2.5 px-2 rounded-lg hover:bg-dex-hover text-sm text-foreground">
            <div className="flex items-center gap-2"><Shield size={16} /> Administrators</div>
            <span className="text-xs text-muted-foreground">{(chat.admins || []).length}</span>
          </button>
          <div className="flex items-center justify-between py-2.5 px-2 text-sm text-foreground">
            <span>Subscribers</span>
            <span className="text-xs text-muted-foreground">{chat.subscriberCount?.toLocaleString()}</span>
          </div>
        </div>

        <div className="h-px bg-border my-3" />

        {/* Delete */}
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} className="w-full py-2.5 px-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 text-left transition-colors">
            🗑️ Delete Channel
          </button>
        ) : (
          <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
            <p className="text-sm text-destructive mb-3">Are you sure? This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-dex-hover">Cancel</button>
              <button onClick={onDeleteChannel} className="px-3 py-1.5 rounded-lg text-xs bg-destructive text-destructive-foreground">Delete</button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-dex-hover">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()} className="px-5 py-2 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-40">Save</button>
        </div>
      </div>
    </div>
  );
};

// ============= EDIT GROUP MODAL =============
interface EditGroupModalProps {
  chat: Chat;
  onSave: (settings: Partial<Chat>) => void;
  onClose: () => void;
  onOpenInviteLinks: () => void;
  onOpenAdmins: () => void;
  onDeleteGroup: () => void;
}

export const EditGroupModal: React.FC<EditGroupModalProps> = ({ chat, onSave, onClose, onOpenInviteLinks, onOpenAdmins, onDeleteGroup }) => {
  const [name, setName] = useState(chat.name);
  const [description, setDescription] = useState(chat.bio || chat.description || '');
  const [isPublic, setIsPublic] = useState(chat.isPublic ?? false);
  const [chatHistory, setChatHistory] = useState(chat.chatHistoryForNewMembers ?? true);
  const [slowMode, setSlowMode] = useState(chat.slowMode ?? 0);
  const [perms, setPerms] = useState<GroupPermissions>(chat.permissions ?? {
    sendMessages: true, sendMedia: true, sendStickers: true, sendPolls: true,
    addMembers: true, pinMessages: true, changeInfo: true,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const slowModeOptions = [
    { label: 'Off', value: 0 }, { label: '10s', value: 10 }, { label: '30s', value: 30 },
    { label: '1m', value: 60 }, { label: '5m', value: 300 }, { label: '15m', value: 900 }, { label: '1h', value: 3600 },
  ];

  const handleSave = () => {
    onSave({ name, bio: description, description, isPublic, chatHistoryForNewMembers: chatHistory, slowMode, permissions: perms });
  };

  const togglePerm = (key: keyof GroupPermissions) => {
    setPerms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={MODAL_BACKDROP} onClick={onClose}>
      <div className={`${MODAL_CARD} p-6 w-[460px] max-h-[85vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-foreground">Edit Group</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-dex-hover text-muted-foreground"><X size={18} /></button>
        </div>

        {/* Avatar & Name */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0" style={{ background: `hsl(${chat.avatarColor})` }}>
            {chat.avatar}
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Group Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full mt-1 mb-4 px-3 py-2 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />

        {/* Type & History */}
        <div className="space-y-1 mb-4">
          <div className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-dex-hover">
            <span className="text-sm text-foreground">Group type</span>
            <button onClick={() => setIsPublic(!isPublic)} className={`px-3 py-1 rounded-full text-xs font-medium ${isPublic ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {isPublic ? '🌐 Public' : '🔒 Private'}
            </button>
          </div>
          <div className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-dex-hover">
            <div><span className="text-sm text-foreground">Chat history</span><div className="text-[11px] text-muted-foreground">For new members</div></div>
            <button onClick={() => setChatHistory(!chatHistory)} className={`px-3 py-1 rounded-full text-xs font-medium ${chatHistory ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {chatHistory ? 'Visible' : 'Hidden'}
            </button>
          </div>
        </div>

        <div className="h-px bg-border my-3" />

        {/* Slow Mode */}
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Slow Mode</div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {slowModeOptions.map(o => (
            <button key={o.value} onClick={() => setSlowMode(o.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${slowMode === o.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {o.label}
            </button>
          ))}
        </div>

        <div className="h-px bg-border my-3" />

        {/* Permissions */}
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Member Permissions</div>
        <div className="space-y-1 mb-4">
          {([
            { key: 'sendMessages' as const, label: 'Send messages' },
            { key: 'sendMedia' as const, label: 'Send media' },
            { key: 'sendStickers' as const, label: 'Send stickers/GIFs' },
            { key: 'sendPolls' as const, label: 'Send polls' },
            { key: 'addMembers' as const, label: 'Add members' },
            { key: 'pinMessages' as const, label: 'Pin messages' },
            { key: 'changeInfo' as const, label: 'Change group info' },
          ]).map(p => (
            <div key={p.key} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-dex-hover">
              <span className="text-sm text-foreground">{p.label}</span>
              <button onClick={() => togglePerm(p.key)} className={`w-10 h-5.5 rounded-full transition-colors ${perms[p.key] ? 'bg-primary' : 'bg-muted'} flex items-center ${perms[p.key] ? 'justify-end' : 'justify-start'} px-0.5`}>
                <div className="w-4.5 h-4.5 rounded-full bg-white transition-all" />
              </button>
            </div>
          ))}
        </div>

        <div className="h-px bg-border my-3" />

        {/* Management */}
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Management</div>
        <div className="space-y-0.5 mb-4">
          <button onClick={onOpenInviteLinks} className="flex items-center justify-between w-full py-2.5 px-2 rounded-lg hover:bg-dex-hover text-sm text-foreground">
            <div className="flex items-center gap-2"><Link size={16} /> Invite links</div>
            <span className="text-xs text-muted-foreground">{(chat.inviteLinks || []).length}</span>
          </button>
          <button onClick={onOpenAdmins} className="flex items-center justify-between w-full py-2.5 px-2 rounded-lg hover:bg-dex-hover text-sm text-foreground">
            <div className="flex items-center gap-2"><Shield size={16} /> Administrators</div>
            <span className="text-xs text-muted-foreground">{(chat.admins || []).length}</span>
          </button>
          <div className="flex items-center justify-between py-2.5 px-2 text-sm text-foreground">
            <span>Members</span>
            <span className="text-xs text-muted-foreground">{chat.memberCount || chat.members?.length || 0}</span>
          </div>
        </div>

        <div className="h-px bg-border my-3" />

        {/* Delete */}
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} className="w-full py-2.5 px-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 text-left transition-colors">
            🗑️ Delete Group
          </button>
        ) : (
          <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
            <p className="text-sm text-destructive mb-3">Are you sure? This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-dex-hover">Cancel</button>
              <button onClick={onDeleteGroup} className="px-3 py-1.5 rounded-lg text-xs bg-destructive text-destructive-foreground">Delete</button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-dex-hover">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()} className="px-5 py-2 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-40">Save</button>
        </div>
      </div>
    </div>
  );
};

// ============= INVITE LINKS MODAL =============
interface InviteLinksModalProps {
  inviteLinks: InviteLink[];
  onCreate: () => void;
  onRevoke: (linkId: string) => void;
  onClose: () => void;
}

export const InviteLinksModal: React.FC<InviteLinksModalProps> = ({ inviteLinks, onCreate, onRevoke, onClose }) => {
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
          {inviteLinks.map(link => (
            <div key={link.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-mono truncate">{link.link}</p>
                <p className="text-[11px] text-muted-foreground">
                  {link.uses} uses{link.maxUses ? ` / ${link.maxUses} max` : ''}
                  {link.expiresAt ? ` · Expires ${link.expiresAt}` : ''}
                </p>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(link.link); }} className="p-1.5 rounded-lg hover:bg-dex-hover text-muted-foreground" title="Copy">
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

// ============= ADMIN MANAGEMENT MODAL =============
interface AdminManagementModalProps {
  chat: Chat;
  users: User[];
  onPromote: (userId: string, title: string) => void;
  onDemote: (userId: string) => void;
  onClose: () => void;
}

export const AdminManagementModal: React.FC<AdminManagementModalProps> = ({ chat, users: allUsers, onPromote, onDemote, onClose }) => {
  const [showPromote, setShowPromote] = useState(false);
  const [promoteUserId, setPromoteUserId] = useState('');
  const [promoteTitle, setPromoteTitle] = useState('');

  const admins = chat.admins || [];
  const members = chat.members || [];
  const nonAdminMembers = members.filter(m => !admins.find(a => a.userId === m.id));

  const getUserInfo = (userId: string) => {
    return allUsers.find(u => u.id === userId) || members.find(m => m.id === userId);
  };

  return (
    <div className={MODAL_BACKDROP} onClick={onClose}>
      <div className={`${MODAL_CARD} p-6 w-[420px] max-h-[600px] flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">👑 Administrators ({admins.length})</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-dex-hover text-muted-foreground"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 mb-4">
          {admins.map(admin => {
            const user = getUserInfo(admin.userId);
            return (
              <div key={admin.userId} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-dex-hover transition-colors">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ background: `hsl(${user?.color || '252 75% 64%'})` }}>
                  {user?.avatar || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground">{user?.name || admin.userId}</span>
                    {admin.userId === 'me' && <Crown size={12} className="text-amber-500" />}
                  </div>
                  {admin.title && <span className="text-[11px] text-primary">{admin.title}</span>}
                </div>
                {admin.userId !== 'me' && (
                  <button onClick={() => onDemote(admin.userId)} className="px-2 py-1 rounded text-xs text-destructive hover:bg-destructive/10 transition-colors">
                    Demote
                  </button>
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
          <div className="border border-border rounded-lg p-3 space-y-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select member to promote</div>
            <div className="max-h-[150px] overflow-y-auto space-y-1">
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
            <input value={promoteTitle} onChange={e => setPromoteTitle(e.target.value)} placeholder="Custom title (optional)" className="w-full px-3 py-2 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <div className="flex gap-2">
              <button onClick={() => { setShowPromote(false); setPromoteUserId(''); setPromoteTitle(''); }} className="flex-1 py-2 rounded-lg text-sm text-muted-foreground hover:bg-dex-hover">Cancel</button>
              <button disabled={!promoteUserId} onClick={() => { onPromote(promoteUserId, promoteTitle); setShowPromote(false); setPromoteUserId(''); setPromoteTitle(''); }}
                className="flex-1 py-2 rounded-lg text-sm bg-primary text-primary-foreground disabled:opacity-40">Promote</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============= LEAVE CONFIRM DIALOG =============
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
