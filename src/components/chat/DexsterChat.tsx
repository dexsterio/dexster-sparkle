import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Chat, Message, Comment, CustomFolder, MessageEffect } from '@/types/chat';
import { initialChats, initialMessages, initialComments, users } from '@/data/mockData';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import InfoPanel from './InfoPanel';
import CommentsPanel from './CommentsPanel';
import { DeleteDialog, ForwardModal, CreateChannelModal, CreateGroupModal, PollCreationModal, PinConfirmModal, ReportDialog, MuteOptionsModal, SchedulePickerModal, FolderEditorModal, AutoDeleteDialog, EffectPickerMenu, ClearHistoryDialog, EditChannelModal, EditGroupModal, InviteLinksModal, AdminManagementModal, LeaveConfirmDialog } from './Modals';

const DexsterChat: React.FC = () => {
  // Core state
  const [activeChat, setActiveChat] = useState('alex');
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [messages, setMessages] = useState<Record<string, Message[]>>(initialMessages);
  const [comments, setComments] = useState<Record<string, Comment[]>>(initialComments);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  // Message actions
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editMsg, setEditMsg] = useState<Message | null>(null);
  const [deleteMsg, setDeleteMsg] = useState<Message | null>(null);
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null);
  const [pinConfirmMsg, setPinConfirmMsg] = useState<Message | null>(null);
  const [reportTarget, setReportTarget] = useState<string | null>(null);

  // Modals
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showFolderEditor, setShowFolderEditor] = useState(false);
  const [showAutoDeleteDialog, setShowAutoDeleteDialog] = useState(false);
  const [showMuteOptions, setShowMuteOptions] = useState<string | null>(null);
  const [effectPicker, setEffectPicker] = useState(false);
  const [showClearHistory, setShowClearHistory] = useState(false);
  const [showEditChannel, setShowEditChannel] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [showInviteLinks, setShowInviteLinks] = useState(false);
  const [showAdminManagement, setShowAdminManagement] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Multi-select
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());

  // Chat search
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [chatSearchIndex, setChatSearchIndex] = useState(0);
  const [showChatSearch, setShowChatSearch] = useState(false);

  // Organization
  const [customFolders, setCustomFolders] = useState<CustomFolder[]>([]);
  const [chatDrafts, setChatDrafts] = useState<Record<string, string>>({});

  // UI
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [showCommentsFor, setShowCommentsFor] = useState<string | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<Record<string, number>>({});
  const [recentEmojis, setRecentEmojis] = useState<string[]>(['👍', '❤️', '🔥', '😂', '😮', '👏']);
  const [pendingEffect, setPendingEffect] = useState<MessageEffect | null>(null);
  const [scheduledText, setScheduledText] = useState('');
  const [bulkForwardTarget, setBulkForwardTarget] = useState(false);

  // Timers ref for cleanup
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const chat = chats.find(c => c.id === activeChat);
  const chatMessages = messages[activeChat] || [];
  const visibleChats = chats.filter(c => !c.archived && !c.blocked);
  const archivedChats = chats.filter(c => c.archived);

  // Simulate typing
  useEffect(() => {
    if (activeChat === 'alex') {
      const t1 = setTimeout(() => setTypingUsers(prev => ({ ...prev, alex: ['Alex Volkov'] })), 3000);
      const t2 = setTimeout(() => setTypingUsers(prev => ({ ...prev, alex: [] })), 6000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [activeChat]);

  // Cleanup timers
  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // ========= CHAT SELECTION & DRAFTS =========
  const selectChat = useCallback((id: string) => {
    // Save current draft
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea && textarea.value.trim()) {
      setChatDrafts(prev => ({ ...prev, [activeChat]: textarea.value }));
    } else {
      setChatDrafts(prev => { const n = { ...prev }; delete n[activeChat]; return n; });
    }

    setActiveChat(id);
    setShowInfoPanel(false);
    setReplyTo(null);
    setEditMsg(null);
    setSelectMode(false);
    setSelectedMessages(new Set());
    setShowChatSearch(false);
    setChatSearchQuery('');
    // Mark as read
    setChats(prev => prev.map(c => c.id === id ? { ...c, unread: 0, markedUnread: false } : c));
  }, [activeChat]);

  // ========= SEND MESSAGE =========
  const sendMessage = useCallback((text: string, options?: { silent?: boolean; effect?: MessageEffect }) => {
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      chatId: activeChat,
      senderId: 'me',
      senderName: 'You',
      text,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: '2026-02-10',
      isOwn: true,
      read: false,
      type: 'message',
      replyTo: replyTo ? { messageId: replyTo.id, senderName: replyTo.senderName, text: replyTo.text.slice(0, 60) } : undefined,
      silentSend: options?.silent,
      effect: options?.effect || pendingEffect || undefined,
    };
    setMessages(prev => ({ ...prev, [activeChat]: [...(prev[activeChat] || []), newMsg] }));
    setChats(prev => prev.map(c => c.id === activeChat ? { ...c, lastMessage: text, lastMessageSender: 'You', lastTime: newMsg.time } : c));
    setReplyTo(null);
    setPendingEffect(null);

    // Auto-delete timer
    const chatObj = chats.find(c => c.id === activeChat);
    if (chatObj?.autoDeleteTimer) {
      const timer = setTimeout(() => {
        setMessages(prev => ({ ...prev, [activeChat]: (prev[activeChat] || []).filter(m => m.id !== newMsg.id) }));
      }, chatObj.autoDeleteTimer * 1000);
      timersRef.current.push(timer);
    }
  }, [activeChat, replyTo, pendingEffect, chats]);

  // ========= SEND GIF =========
  const sendGif = useCallback((gifUrl: string) => {
    const newMsg: Message = {
      id: `gif_${Date.now()}`,
      chatId: activeChat,
      senderId: 'me',
      senderName: 'You',
      text: '',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: '2026-02-10',
      isOwn: true,
      read: false,
      type: 'gif',
      gifUrl,
      replyTo: replyTo ? { messageId: replyTo.id, senderName: replyTo.senderName, text: replyTo.text.slice(0, 60) } : undefined,
    };
    setMessages(prev => ({ ...prev, [activeChat]: [...(prev[activeChat] || []), newMsg] }));
    setChats(prev => prev.map(c => c.id === activeChat ? { ...c, lastMessage: 'GIF', lastMessageSender: 'You', lastTime: newMsg.time } : c));
    setReplyTo(null);
  }, [activeChat, replyTo]);

  // ========= EDIT =========
  const saveEdit = useCallback((text: string) => {
    if (!editMsg) return;
    setMessages(prev => ({
      ...prev,
      [activeChat]: prev[activeChat].map(m => m.id === editMsg.id ? { ...m, text, edited: true } : m),
    }));
    setEditMsg(null);
  }, [activeChat, editMsg]);

  // ========= DELETE =========
  const handleDelete = useCallback((forAll: boolean) => {
    if (!deleteMsg) return;
    setMessages(prev => ({
      ...prev,
      [activeChat]: prev[activeChat].filter(m => m.id !== deleteMsg.id),
    }));
    setDeleteMsg(null);
  }, [activeChat, deleteMsg]);

  // ========= FORWARD =========
  const handleForward = useCallback((toChatId: string) => {
    const msgsToForward = forwardMsg ? [forwardMsg] : Array.from(selectedMessages).map(id => chatMessages.find(m => m.id === id)).filter(Boolean) as Message[];
    
    msgsToForward.forEach(msg => {
      const fwd: Message = {
        ...msg,
        id: `fwd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        chatId: toChatId,
        isOwn: true,
        senderId: 'me',
        senderName: 'You',
        forwarded: { from: msg.senderName },
        replyTo: undefined,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        date: '2026-02-10',
        read: false,
        reactions: [],
        pinned: false,
      };
      setMessages(prev => ({ ...prev, [toChatId]: [...(prev[toChatId] || []), fwd] }));
    });

    setForwardMsg(null);
    setSelectMode(false);
    setSelectedMessages(new Set());
    setBulkForwardTarget(false);
    showToast(`Message${msgsToForward.length > 1 ? 's' : ''} forwarded`);
  }, [forwardMsg, selectedMessages, chatMessages, showToast]);

  // ========= PIN =========
  const handlePin = useCallback((msg: Message) => {
    setPinConfirmMsg(msg);
  }, []);

  const confirmPin = useCallback((notify: boolean) => {
    if (!pinConfirmMsg) return;
    const wasPinned = pinConfirmMsg.pinned;
    setMessages(prev => ({
      ...prev,
      [activeChat]: prev[activeChat].map(m => m.id === pinConfirmMsg.id ? { ...m, pinned: !m.pinned } : m),
    }));
    if (!wasPinned) {
      // Add service message
      const svc: Message = {
        id: `svc_${Date.now()}`, chatId: activeChat, senderId: 'system', senderName: '', text: '',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        date: '2026-02-10', isOwn: false, read: true, type: 'service',
        serviceText: 'You pinned a message',
      };
      setMessages(prev => ({ ...prev, [activeChat]: [...prev[activeChat], svc] }));
    }
    setPinConfirmMsg(null);
    showToast(wasPinned ? 'Message unpinned' : 'Message pinned');
  }, [activeChat, pinConfirmMsg, showToast]);

  // ========= REACTIONS =========
  const handleReaction = useCallback((msgId: string, emoji: string) => {
    setMessages(prev => ({
      ...prev,
      [activeChat]: prev[activeChat].map(m => {
        if (m.id !== msgId) return m;
        const reactions = [...(m.reactions || [])];
        const existing = reactions.find(r => r.emoji === emoji);
        if (existing) {
          if (existing.users.includes('me')) {
            existing.users = existing.users.filter(u => u !== 'me');
            if (existing.users.length === 0) return { ...m, reactions: reactions.filter(r => r.emoji !== emoji) };
          } else {
            existing.users.push('me');
          }
        } else {
          reactions.push({ emoji, users: ['me'] });
        }
        return { ...m, reactions };
      }),
    }));
    // Track recent emoji
    setRecentEmojis(prev => {
      const filtered = prev.filter(e => e !== emoji);
      return [emoji, ...filtered].slice(0, 20);
    });
  }, [activeChat]);

  // ========= SIDEBAR ACTIONS =========
  const pinChat = useCallback((id: string) => {
    setChats(prev => prev.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c));
  }, []);

  const muteChat = useCallback((id: string, duration?: number) => {
    setChats(prev => prev.map(c => {
      if (c.id !== id) return c;
      if (c.muted) return { ...c, muted: false, muteUntil: undefined };
      const muteUntil = duration ? Date.now() + duration * 1000 : 0;
      return { ...c, muted: true, muteUntil };
    }));
    // Auto-unmute timer
    if (duration) {
      const timer = setTimeout(() => {
        setChats(prev => prev.map(c => c.id === id ? { ...c, muted: false, muteUntil: undefined } : c));
      }, duration * 1000);
      timersRef.current.push(timer);
    }
  }, []);

  const deleteChat = useCallback((id: string) => {
    setChats(prev => prev.filter(c => c.id !== id));
    if (activeChat === id) {
      const remaining = chats.filter(c => c.id !== id && !c.archived && !c.blocked);
      setActiveChat(remaining[0]?.id || '');
    }
  }, [activeChat, chats]);

  const markRead = useCallback((id: string) => {
    setChats(prev => prev.map(c => c.id === id ? { ...c, unread: 0, markedUnread: false } : c));
  }, []);

  const markUnread = useCallback((id: string) => {
    setChats(prev => prev.map(c => c.id === id ? { ...c, markedUnread: true, unread: Math.max(c.unread, 1) } : c));
  }, []);

  const archiveChat = useCallback((id: string) => {
    setChats(prev => prev.map(c => c.id === id ? { ...c, archived: true } : c));
    if (activeChat === id) {
      const remaining = chats.filter(c => c.id !== id && !c.archived && !c.blocked);
      setActiveChat(remaining[0]?.id || '');
    }
    showToast('Chat archived');
  }, [activeChat, chats, showToast]);

  const unarchiveChat = useCallback((id: string) => {
    setChats(prev => prev.map(c => c.id === id ? { ...c, archived: false } : c));
    showToast('Chat unarchived');
  }, [showToast]);

  const blockUser = useCallback((id: string) => {
    setChats(prev => prev.map(c => c.id === id ? { ...c, blocked: true } : c));
    if (activeChat === id) {
      const remaining = chats.filter(c => c.id !== id && !c.archived && !c.blocked);
      setActiveChat(remaining[0]?.id || '');
    }
    showToast('User blocked');
  }, [activeChat, chats, showToast]);

  const unblockUser = useCallback((id: string) => {
    setChats(prev => prev.map(c => c.id === id ? { ...c, blocked: false } : c));
    showToast('User unblocked');
  }, [showToast]);

  const leaveChat = useCallback((id: string) => {
    const svc: Message = {
      id: `svc_${Date.now()}`, chatId: id, senderId: 'system', senderName: '', text: '',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: '2026-02-10', isOwn: false, read: true, type: 'service', serviceText: 'You left the chat',
    };
    setMessages(prev => ({ ...prev, [id]: [...(prev[id] || []), svc] }));
    deleteChat(id);
    showToast('You left the chat');
  }, [deleteChat, showToast]);

  // ========= BOOKMARKS =========
  const bookmarkMessage = useCallback((msg: Message) => {
    const saved: Message = {
      ...msg,
      id: `bm_${Date.now()}`,
      chatId: 'saved',
      isOwn: true,
      senderId: 'me',
      senderName: 'You',
      forwarded: { from: msg.senderName },
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: '2026-02-10',
      read: true,
      bookmarked: true,
      reactions: [],
      pinned: false,
    };
    setMessages(prev => ({ ...prev, saved: [...(prev.saved || []), saved] }));
    showToast('Saved to bookmarks');
  }, [showToast]);

  // ========= TRANSLATE =========
  const translateMessage = useCallback((msgId: string) => {
    setMessages(prev => ({
      ...prev,
      [activeChat]: prev[activeChat].map(m => {
        if (m.id !== msgId) return m;
        if (m.translated) return { ...m, translated: undefined };
        // Mock: reverse words
        const words = m.text.split(' ');
        const translated = words.map(w => w.split('').reverse().join('')).join(' ');
        return { ...m, translated: `[Translated] ${translated}` };
      }),
    }));
  }, [activeChat]);

  // ========= POLLS =========
  const createPoll = useCallback((question: string, options: string[], multiChoice: boolean, quizMode: boolean, correctOption?: number, explanation?: string) => {
    const pollMsg: Message = {
      id: `poll_${Date.now()}`, chatId: activeChat, senderId: 'me', senderName: 'You', text: '',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: '2026-02-10', isOwn: true, read: false, type: 'poll',
      pollData: {
        question,
        options: options.map(t => ({ text: t, voters: [] })),
        multiChoice,
        quizMode,
        correctOption,
        explanation,
      },
    };
    setMessages(prev => ({ ...prev, [activeChat]: [...(prev[activeChat] || []), pollMsg] }));
    setChats(prev => prev.map(c => c.id === activeChat ? { ...c, lastMessage: `📊 ${question}`, lastMessageSender: 'You', lastTime: pollMsg.time } : c));
    setShowPollModal(false);
  }, [activeChat]);

  const votePoll = useCallback((msgId: string, optionIndex: number) => {
    setMessages(prev => ({
      ...prev,
      [activeChat]: prev[activeChat].map(m => {
        if (m.id !== msgId || !m.pollData) return m;
        const pd = { ...m.pollData, options: m.pollData.options.map((o, i) => ({ ...o, voters: [...o.voters] })) };
        if (optionIndex === -1) {
          // Retract vote
          pd.options.forEach(o => { o.voters = o.voters.filter(v => v !== 'me'); });
        } else if (pd.multiChoice) {
          const opt = pd.options[optionIndex];
          if (opt.voters.includes('me')) opt.voters = opt.voters.filter(v => v !== 'me');
          else opt.voters.push('me');
        } else {
          pd.options.forEach(o => { o.voters = o.voters.filter(v => v !== 'me'); });
          pd.options[optionIndex].voters.push('me');
        }
        return { ...m, pollData: pd };
      }),
    }));
  }, [activeChat]);

  // ========= DICE =========
  const rollDice = useCallback((emoji: string) => {
    const value = Math.floor(Math.random() * 6) + 1;
    const diceMsg: Message = {
      id: `dice_${Date.now()}`, chatId: activeChat, senderId: 'me', senderName: 'You', text: '',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: '2026-02-10', isOwn: true, read: false, type: 'dice',
      diceResult: { emoji, value },
    };
    setMessages(prev => ({ ...prev, [activeChat]: [...(prev[activeChat] || []), diceMsg] }));
    setChats(prev => prev.map(c => c.id === activeChat ? { ...c, lastMessage: `${emoji} ${value}`, lastMessageSender: 'You', lastTime: diceMsg.time } : c));
  }, [activeChat]);

  // ========= COMMENTS =========
  const addComment = useCallback((postId: string, text: string, replyTo?: { senderName: string; text: string }) => {
    const comment: Comment = {
      id: `cmt_${Date.now()}`,
      senderId: 'me',
      senderName: 'You',
      senderColor: '252 75% 64%',
      text,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      replyTo,
    };
    setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), comment] }));
    // Update comment count on post
    setMessages(prev => {
      const updated: Record<string, Message[]> = {};
      for (const [chatId, msgs] of Object.entries(prev)) {
        updated[chatId] = msgs.map(m => m.id === postId ? { ...m, comments: (m.comments || 0) + 1 } : m);
      }
      return updated;
    });
  }, []);

  // ========= SCHEDULED MESSAGES =========
  const scheduleMessage = useCallback((text: string, scheduledFor: Date) => {
    const msg: Message = {
      id: `sched_${Date.now()}`, chatId: activeChat, senderId: 'me', senderName: 'You', text,
      time: scheduledFor.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: scheduledFor.toISOString().split('T')[0], isOwn: true, read: false, type: 'message',
      scheduled: true, scheduledTime: scheduledFor.toLocaleString(),
    };
    // Add as scheduled (visible with clock icon)
    setMessages(prev => ({ ...prev, [activeChat]: [...(prev[activeChat] || []), msg] }));
    showToast(`Message scheduled for ${scheduledFor.toLocaleString()}`);
    setShowScheduleModal(false);

    // Auto-send at scheduled time
    const delay = scheduledFor.getTime() - Date.now();
    if (delay > 0) {
      const timer = setTimeout(() => {
        setMessages(prev => ({
          ...prev,
          [activeChat]: prev[activeChat].map(m => m.id === msg.id ? { ...m, scheduled: false, scheduledTime: undefined } : m),
        }));
      }, delay);
      timersRef.current.push(timer);
    }
  }, [activeChat, showToast]);

  // ========= MULTI-SELECT =========
  const toggleSelectMessage = useCallback((msgId: string) => {
    setSelectedMessages(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId); else next.add(msgId);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const all = chatMessages.filter(m => m.type === 'message' || m.type === 'poll').map(m => m.id);
    setSelectedMessages(new Set(all));
  }, [chatMessages]);

  const bulkDelete = useCallback(() => {
    setMessages(prev => ({
      ...prev,
      [activeChat]: prev[activeChat].filter(m => !selectedMessages.has(m.id)),
    }));
    showToast(`${selectedMessages.size} message${selectedMessages.size > 1 ? 's' : ''} deleted`);
    setSelectMode(false);
    setSelectedMessages(new Set());
  }, [activeChat, selectedMessages, showToast]);

  const bulkCopy = useCallback(() => {
    const texts = chatMessages.filter(m => selectedMessages.has(m.id)).map(m => m.text).join('\n\n');
    navigator.clipboard.writeText(texts);
    showToast('Copied to clipboard');
    setSelectMode(false);
    setSelectedMessages(new Set());
  }, [chatMessages, selectedMessages, showToast]);

  // ========= IN-CHAT SEARCH =========
  const searchResults = chatSearchQuery
    ? chatMessages.filter(m => m.text.toLowerCase().includes(chatSearchQuery.toLowerCase())).map(m => m.id)
    : [];

  const navigateSearch = useCallback((dir: 'up' | 'down') => {
    if (searchResults.length === 0) return;
    setChatSearchIndex(prev => {
      if (dir === 'up') return prev > 0 ? prev - 1 : searchResults.length - 1;
      return prev < searchResults.length - 1 ? prev + 1 : 0;
    });
  }, [searchResults]);

  // ========= PIN NAVIGATION =========
  const cyclePinnedMessage = useCallback(() => {
    const pinned = chatMessages.filter(m => m.pinned);
    if (pinned.length === 0) return;
    const current = pinnedIndex[activeChat] || 0;
    const next = (current + 1) % pinned.length;
    setPinnedIndex(prev => ({ ...prev, [activeChat]: next }));
    return pinned[next]?.id;
  }, [activeChat, chatMessages, pinnedIndex]);

  // ========= FOLDERS =========
  const createCustomFolder = useCallback((name: string, emoji: string, chatIds: string[]) => {
    const folder: CustomFolder = { id: `folder_${Date.now()}`, name, emoji, includedChatIds: chatIds };
    setCustomFolders(prev => [...prev, folder]);
    setShowFolderEditor(false);
    showToast(`Folder "${name}" created`);
  }, [showToast]);

  const moveToFolder = useCallback((chatId: string, folderId: string) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, folderId } : c));
    setCustomFolders(prev => prev.map(f => f.id === folderId ? { ...f, includedChatIds: [...f.includedChatIds, chatId] } : f));
    showToast('Moved to folder');
  }, [showToast]);

  // ========= CLEAR HISTORY =========
  const clearHistory = useCallback((forAll: boolean) => {
    setMessages(prev => ({ ...prev, [activeChat]: [] }));
    setChats(prev => prev.map(c => c.id === activeChat
      ? { ...c, lastMessage: '', lastTime: '', lastMessageSender: undefined }
      : c));
    setShowClearHistory(false);
    showToast('History cleared');
  }, [activeChat, showToast]);

  // ========= UPDATE CHANNEL SETTINGS =========
  const updateChannelSettings = useCallback((settings: Partial<Chat>) => {
    setChats(prev => prev.map(c => c.id === activeChat ? { ...c, ...settings } : c));
    setShowEditChannel(false);
    showToast('Channel settings updated');
  }, [activeChat, showToast]);

  // ========= UPDATE GROUP SETTINGS =========
  const updateGroupSettings = useCallback((settings: Partial<Chat>) => {
    setChats(prev => prev.map(c => c.id === activeChat ? { ...c, ...settings } : c));
    setShowEditGroup(false);
    showToast('Group settings updated');
  }, [activeChat, showToast]);

  // ========= INVITE LINKS =========
  const createInviteLink = useCallback((maxUses?: number) => {
    const link: import('@/types/chat').InviteLink = {
      id: `inv_${Date.now()}`,
      link: `t.me/+${Math.random().toString(36).slice(2, 10)}`,
      uses: 0,
      maxUses,
      createdBy: 'me',
    };
    setChats(prev => prev.map(c => c.id === activeChat ? { ...c, inviteLinks: [...(c.inviteLinks || []), link] } : c));
    showToast('Invite link created');
  }, [activeChat, showToast]);

  const revokeInviteLink = useCallback((linkId: string) => {
    setChats(prev => prev.map(c => c.id === activeChat ? { ...c, inviteLinks: (c.inviteLinks || []).filter(l => l.id !== linkId) } : c));
    showToast('Invite link revoked');
  }, [activeChat, showToast]);

  // ========= ADMIN MANAGEMENT =========
  const promoteAdmin = useCallback((userId: string, title: string) => {
    const defaultPerms: import('@/types/chat').AdminPermissions = {
      changeInfo: false, postMessages: true, editMessages: false, deleteMessages: true,
      banUsers: true, inviteUsers: true, pinMessages: true, manageVideoChats: false,
      stayAnonymous: false, addAdmins: false,
    };
    setChats(prev => prev.map(c => {
      if (c.id !== activeChat) return c;
      const admins = [...(c.admins || [])];
      const existing = admins.findIndex(a => a.userId === userId);
      if (existing >= 0) admins[existing] = { ...admins[existing], title };
      else admins.push({ userId, title, permissions: defaultPerms });
      return { ...c, admins };
    }));
    showToast('Admin updated');
  }, [activeChat, showToast]);

  const demoteAdmin = useCallback((userId: string) => {
    setChats(prev => prev.map(c => c.id === activeChat ? { ...c, admins: (c.admins || []).filter(a => a.userId !== userId) } : c));
    showToast('Admin demoted');
  }, [activeChat, showToast]);

  // ========= AUTO-DELETE =========
  const setAutoDelete = useCallback((chatId: string, timer: number) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, autoDeleteTimer: timer } : c));
    setShowAutoDeleteDialog(false);
    showToast(timer ? `Auto-delete set to ${timer < 86400 ? `${timer / 3600}h` : timer < 604800 ? `${timer / 86400} day(s)` : `${timer / 604800} week(s)`}` : 'Auto-delete disabled');
  }, [showToast]);

  // ========= COPY LINK =========
  const copyMessageLink = useCallback((msg: Message) => {
    navigator.clipboard.writeText(`t.me/dexster/${msg.chatId}/${msg.id}`);
    showToast('Link copied');
  }, [showToast]);

  // ========= REPORT =========
  const handleReport = useCallback((reason: string) => {
    setReportTarget(null);
    showToast('Report submitted. Thank you.');
  }, [showToast]);

  // ========= CREATE GROUP =========
  const createGroup = useCallback((name: string, memberIds: string[], description: string) => {
    const id = `grp_${Date.now()}`;
    const members = memberIds.map(mid => {
      const u = Object.values(users).find((usr: any) => usr.id === mid) as any;
      return u || { id: mid, name: mid, avatar: mid.slice(0, 2).toUpperCase(), color: '252 75% 64%', online: false };
    });
    const newChat: Chat = {
      id, name, type: 'group', avatar: name.slice(0, 2).toUpperCase(), avatarColor: `${Math.floor(Math.random() * 360)} 60% 50%`,
      muted: false, pinned: false, unread: 0, lastMessage: 'Group created', lastTime: 'now',
      memberCount: memberIds.length + 1, members: members as any, bio: description, role: 'owner',
      admins: [{
        userId: 'me', title: 'Creator',
        permissions: { changeInfo: true, postMessages: true, editMessages: true, deleteMessages: true, banUsers: true, inviteUsers: true, pinMessages: true, manageVideoChats: true, stayAnonymous: false, addAdmins: true }
      }],
      inviteLinks: [],
      permissions: { sendMessages: true, sendMedia: true, sendStickers: true, sendPolls: true, addMembers: true, pinMessages: true, changeInfo: true },
      slowMode: 0,
      chatHistoryForNewMembers: true,
    };
    setChats(prev => [...prev, newChat]);
    setMessages(prev => ({
      ...prev,
      [id]: [{ id: `svc_${Date.now()}`, chatId: id, senderId: 'system', senderName: '', text: '', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), date: '2026-02-10', isOwn: false, read: true, type: 'service', serviceText: 'You created the group' }],
    }));
    setShowGroupModal(false);
    setActiveChat(id);
  }, []);

  // ========= CREATE CHANNEL =========
  const createChannel = useCallback((name: string, description: string, isPublic: boolean, commentsEnabled: boolean, reactionsEnabled: boolean) => {
    const id = `ch_${Date.now()}`;
    const newChat: Chat = {
      id, name, type: 'channel', avatar: name.slice(0, 2).toUpperCase(), avatarColor: `${Math.floor(Math.random() * 360)} 65% 55%`,
      muted: false, pinned: false, unread: 0, lastMessage: 'Channel created', lastTime: 'now',
      isPublic, description, subscriberCount: 1, commentsEnabled, reactionsEnabled,
      role: 'owner',
      admins: [{
        userId: 'me', title: 'Owner',
        permissions: { changeInfo: true, postMessages: true, editMessages: true, deleteMessages: true, banUsers: true, inviteUsers: true, pinMessages: true, manageVideoChats: true, stayAnonymous: false, addAdmins: true }
      }],
      inviteLinks: [],
      signMessages: false,
      autoTranslate: false,
      directMessages: true,
    };
    setChats(prev => [...prev, newChat]);
    setMessages(prev => ({
      ...prev,
      [id]: [{ id: `svc_${Date.now()}`, chatId: id, senderId: 'system', senderName: '', text: '', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), date: '2026-02-10', isOwn: false, read: true, type: 'service', serviceText: 'Channel created' }],
    }));
    setShowChannelModal(false);
    setActiveChat(id);
  }, []);

  // ========= KEYBOARD SHORTCUTS =========
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showClearHistory) setShowClearHistory(false);
        else if (showEditChannel) setShowEditChannel(false);
        else if (showEditGroup) setShowEditGroup(false);
        else if (showInviteLinks) setShowInviteLinks(false);
        else if (showAdminManagement) setShowAdminManagement(false);
        else if (showCommentsFor) setShowCommentsFor(null);
        else if (showChannelModal) setShowChannelModal(false);
        else if (showGroupModal) setShowGroupModal(false);
        else if (showPollModal) setShowPollModal(false);
        else if (showScheduleModal) setShowScheduleModal(false);
        else if (showFolderEditor) setShowFolderEditor(false);
        else if (showAutoDeleteDialog) setShowAutoDeleteDialog(false);
        else if (showMuteOptions) setShowMuteOptions(null);
        else if (deleteMsg) setDeleteMsg(null);
        else if (forwardMsg) setForwardMsg(null);
        else if (pinConfirmMsg) setPinConfirmMsg(null);
        else if (reportTarget) setReportTarget(null);
        else if (bulkForwardTarget) setBulkForwardTarget(false);
        else if (selectMode) { setSelectMode(false); setSelectedMessages(new Set()); }
        else if (showChatSearch) { setShowChatSearch(false); setChatSearchQuery(''); }
        else if (showInfoPanel) setShowInfoPanel(false);
        else if (editMsg) setEditMsg(null);
        else if (replyTo) setReplyTo(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showClearHistory, showEditChannel, showEditGroup, showInviteLinks, showAdminManagement, showCommentsFor, showChannelModal, showGroupModal, showPollModal, showScheduleModal, showFolderEditor, showAutoDeleteDialog, showMuteOptions, deleteMsg, forwardMsg, pinConfirmMsg, reportTarget, bulkForwardTarget, selectMode, showChatSearch, showInfoPanel, editMsg, replyTo]);

  return (
    <div className="flex h-screen w-full overflow-hidden font-outfit">
      <Sidebar
        chats={visibleChats}
        archivedChats={archivedChats}
        activeChat={activeChat}
        onSelectChat={selectChat}
        onPinChat={pinChat}
        onMuteChat={(id) => muteChat(id)}
        onMuteWithDuration={(id) => setShowMuteOptions(id)}
        onDeleteChat={deleteChat}
        onMarkRead={markRead}
        onMarkUnread={markUnread}
        onArchiveChat={archiveChat}
        onUnarchiveChat={unarchiveChat}
        onBlockUser={blockUser}
        onCreateChannel={() => setShowChannelModal(true)}
        onCreateGroup={() => setShowGroupModal(true)}
        onCreateFolder={() => setShowFolderEditor(true)}
        customFolders={customFolders}
        onMoveToFolder={moveToFolder}
        chatDrafts={chatDrafts}
        onClearHistory={(id) => { setActiveChat(id); setShowClearHistory(true); }}
      />

      {chat && (
        <ChatArea
          chat={chat}
          messages={chatMessages}
          onSendMessage={sendMessage}
          onSendGif={sendGif}
          onReply={setReplyTo}
          onEdit={setEditMsg}
          onDelete={setDeleteMsg}
          onForward={setForwardMsg}
          onPin={handlePin}
          onReaction={handleReaction}
          onBookmark={bookmarkMessage}
          onTranslate={translateMessage}
          onCopyLink={copyMessageLink}
          onSelect={(msgId) => { setSelectMode(true); toggleSelectMessage(msgId); }}
          onVotePoll={votePoll}
          onOpenComments={setShowCommentsFor}
          replyTo={replyTo}
          editMsg={editMsg}
          onCancelReply={() => setReplyTo(null)}
          onCancelEdit={() => setEditMsg(null)}
          onSaveEdit={saveEdit}
          onHeaderClick={() => setShowInfoPanel(!showInfoPanel)}
          typingUsers={typingUsers[activeChat] || []}
          // Select mode
          selectMode={selectMode}
          selectedMessages={selectedMessages}
          onToggleSelect={toggleSelectMessage}
          onSelectAll={selectAll}
          onExitSelect={() => { setSelectMode(false); setSelectedMessages(new Set()); }}
          onBulkDelete={bulkDelete}
          onBulkForward={() => setBulkForwardTarget(true)}
          onBulkCopy={bulkCopy}
          // Search
          showSearch={showChatSearch}
          onToggleSearch={() => { setShowChatSearch(!showChatSearch); setChatSearchQuery(''); setChatSearchIndex(0); }}
          searchQuery={chatSearchQuery}
          onSearchChange={(q) => { setChatSearchQuery(q); setChatSearchIndex(0); }}
          searchResults={searchResults}
          searchIndex={chatSearchIndex}
          onNavigateSearch={navigateSearch}
          // Emoji
          recentEmojis={recentEmojis}
          // Pin navigation
          pinnedIndex={pinnedIndex[activeChat] || 0}
          onCyclePinned={cyclePinnedMessage}
          // Drafts
          draft={chatDrafts[activeChat]}
          // Attachments
          onCreatePoll={() => setShowPollModal(true)}
          onRollDice={rollDice}
          // Schedule & effects
          onSchedule={(text) => { setScheduledText(text); setShowScheduleModal(true); }}
          pendingEffect={pendingEffect}
          onSetEffect={setPendingEffect}
          onToggleEffectPicker={() => setEffectPicker(!effectPicker)}
          showEffectPicker={effectPicker}
          // Header menu actions
          onMuteChat={() => muteChat(activeChat)}
          onClearHistory={() => setShowClearHistory(true)}
          onLeaveChat={() => setShowLeaveConfirm(true)}
          onBlockUser={() => blockUser(activeChat)}
          onDeleteChat={() => deleteChat(activeChat)}
          onManageChannel={() => setShowEditChannel(true)}
          onManageGroup={() => setShowEditGroup(true)}
          onReport={() => setReportTarget(activeChat)}
          slowMode={chat?.slowMode}
        />
      )}

      {chat && (
        <InfoPanel
          chat={chat}
          open={showInfoPanel}
          onClose={() => setShowInfoPanel(false)}
          onMute={() => muteChat(activeChat)}
          onBlock={() => blockUser(activeChat)}
          onUnblock={() => unblockUser(activeChat)}
          onReport={() => setReportTarget(activeChat)}
          onLeave={() => setShowLeaveConfirm(true)}
          onDelete={() => deleteChat(activeChat)}
          onSetAutoDelete={() => setShowAutoDeleteDialog(true)}
          messages={chatMessages}
          onManageChannel={() => setShowEditChannel(true)}
          onManageGroup={() => setShowEditGroup(true)}
        />
      )}

      {showCommentsFor && (
        <CommentsPanel
          comments={comments[showCommentsFor] || []}
          postPreview={chatMessages.find(m => m.id === showCommentsFor)?.text.slice(0, 80) || ''}
          onAddComment={(text, replyTo) => addComment(showCommentsFor, text, replyTo)}
          onClose={() => setShowCommentsFor(null)}
        />
      )}

      {deleteMsg && <DeleteDialog message={deleteMsg} chatName={chat?.name || ''} onConfirm={handleDelete} onCancel={() => setDeleteMsg(null)} />}
      {(forwardMsg || bulkForwardTarget) && <ForwardModal chats={visibleChats} onForward={handleForward} onCancel={() => { setForwardMsg(null); setBulkForwardTarget(false); }} />}
      {showChannelModal && <CreateChannelModal onClose={() => setShowChannelModal(false)} onCreate={createChannel} />}
      {showGroupModal && <CreateGroupModal onClose={() => setShowGroupModal(false)} onCreate={createGroup} />}
      {showPollModal && <PollCreationModal onClose={() => setShowPollModal(false)} onCreate={createPoll} />}
      {pinConfirmMsg && <PinConfirmModal message={pinConfirmMsg} onConfirm={confirmPin} onCancel={() => setPinConfirmMsg(null)} />}
      {reportTarget && <ReportDialog onReport={handleReport} onCancel={() => setReportTarget(null)} />}
      {showMuteOptions && <MuteOptionsModal onMute={(duration) => { muteChat(showMuteOptions, duration); setShowMuteOptions(null); }} onCancel={() => setShowMuteOptions(null)} />}
      {showScheduleModal && <SchedulePickerModal onSchedule={(date) => scheduleMessage(scheduledText, date)} onCancel={() => setShowScheduleModal(false)} />}
      {showFolderEditor && <FolderEditorModal chats={visibleChats} onCreate={createCustomFolder} onClose={() => setShowFolderEditor(false)} />}
      {showAutoDeleteDialog && <AutoDeleteDialog currentTimer={chat?.autoDeleteTimer || 0} onSet={(timer) => setAutoDelete(activeChat, timer)} onCancel={() => setShowAutoDeleteDialog(false)} />}
      {showClearHistory && <ClearHistoryDialog chatName={chat?.name || ''} chatType={chat?.type || 'personal'} onConfirm={clearHistory} onCancel={() => setShowClearHistory(false)} />}
      {showEditChannel && chat && <EditChannelModal chat={chat} onSave={updateChannelSettings} onClose={() => setShowEditChannel(false)} onOpenInviteLinks={() => { setShowEditChannel(false); setShowInviteLinks(true); }} onOpenAdmins={() => { setShowEditChannel(false); setShowAdminManagement(true); }} onDeleteChannel={() => { deleteChat(activeChat); setShowEditChannel(false); }} />}
      {showEditGroup && chat && <EditGroupModal chat={chat} onSave={updateGroupSettings} onClose={() => setShowEditGroup(false)} onOpenInviteLinks={() => { setShowEditGroup(false); setShowInviteLinks(true); }} onOpenAdmins={() => { setShowEditGroup(false); setShowAdminManagement(true); }} onDeleteGroup={() => { deleteChat(activeChat); setShowEditGroup(false); }} />}
      {showInviteLinks && chat && <InviteLinksModal inviteLinks={chat.inviteLinks || []} onCreate={() => createInviteLink()} onRevoke={revokeInviteLink} onClose={() => setShowInviteLinks(false)} />}
      {showAdminManagement && chat && <AdminManagementModal chat={chat} users={Object.values(users)} onPromote={promoteAdmin} onDemote={demoteAdmin} onClose={() => setShowAdminManagement(false)} />}
      {showLeaveConfirm && chat && <LeaveConfirmDialog chatName={chat.name} chatType={chat.type} onConfirm={() => { leaveChat(activeChat); setShowLeaveConfirm(false); }} onCancel={() => setShowLeaveConfirm(false)} />}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-card border border-border text-sm text-foreground shadow-lg animate-[toastIn_0.2s_ease-out] z-50">
          {toast}
        </div>
      )}
    </div>
  );
};

export default DexsterChat;
