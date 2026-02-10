import React, { useState } from 'react';
import { Chat, Message } from '@/types/chat';
import { X } from 'lucide-react';
import { users } from '@/data/mockData';

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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-[fadeIn_0.15s_ease-out]" onClick={onCancel}>
      <div className="bg-card rounded-2xl p-5 w-[400px] max-h-[500px] flex flex-col shadow-2xl animate-[modalIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-foreground">Forward to...</h3>
          <button onClick={onCancel} className="p-1 rounded hover:bg-dex-hover text-muted-foreground"><X size={18} /></button>
        </div>
        <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
          className="w-full px-3 py-2 rounded-full bg-muted text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary mb-3" />
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-[fadeIn_0.15s_ease-out]" onClick={onClose}>
      <div className="bg-card rounded-2xl p-6 w-[420px] max-h-[550px] flex flex-col shadow-2xl animate-[modalIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-[fadeIn_0.15s_ease-out]" onClick={onClose}>
      <div className="bg-card rounded-2xl p-6 w-[420px] max-h-[600px] flex flex-col shadow-2xl animate-[modalIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-[fadeIn_0.15s_ease-out]" onClick={onCancel}>
      <div className="bg-card rounded-2xl p-6 w-[380px] shadow-2xl animate-[modalIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-[fadeIn_0.15s_ease-out]" onClick={onCancel}>
      <div className="bg-card rounded-2xl p-6 w-[380px] shadow-2xl animate-[modalIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-[fadeIn_0.15s_ease-out]" onClick={onCancel}>
      <div className="bg-card rounded-2xl p-6 w-[320px] shadow-2xl animate-[modalIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-[fadeIn_0.15s_ease-out]" onClick={onCancel}>
      <div className="bg-card rounded-2xl p-6 w-[360px] shadow-2xl animate-[modalIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-[fadeIn_0.15s_ease-out]" onClick={onClose}>
      <div className="bg-card rounded-2xl p-6 w-[420px] max-h-[550px] flex flex-col shadow-2xl animate-[modalIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-[fadeIn_0.15s_ease-out]" onClick={onCancel}>
      <div className="bg-card rounded-2xl p-6 w-[320px] shadow-2xl animate-[modalIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
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
