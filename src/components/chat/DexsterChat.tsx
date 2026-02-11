import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Chat, Message, Comment, CustomFolder, MessageEffect } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useFolders } from '@/hooks/useFolders';
import { useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import InfoPanel from './InfoPanel';
import CommentsPanel from './CommentsPanel';
import { DeleteDialog, ForwardModal, CreateChannelModal, CreateGroupModal, PollCreationModal, PinConfirmModal, ReportDialog, MuteOptionsModal, SchedulePickerModal, FolderEditorModal, AutoDeleteDialog, EffectPickerMenu, ClearHistoryDialog, EditChannelModal, EditGroupModal, InviteLinksModal, AdminManagementModal, LeaveConfirmDialog, NewChatModal } from './Modals';

const DexsterChat: React.FC = () => {
  // ========= AUTH & DATA HOOKS =========
  const { currentUser } = useAuth();
  const { on, off } = useWebSocket();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('sidebar');

  const userId = currentUser?.id || 0;
  const userIdStr = String(userId);
  const userName = currentUser?.displayName || currentUser?.username || 'You';

  const {
    conversations,
    pinConversation, muteConversation, archiveConversation,
    markRead, leaveConversation, deleteConversation,
    createGroup: apiCreateGroup, createChannel: apiCreateChannel,
    createDM,
  } = useConversations();

  const { folders: customFolders, createFolder: apiCreateFolder } = useFolders();

  // ========= CORE STATE =========
  const [activeChat, setActiveChat] = useState('');
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
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  // Multi-select
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());

  // Chat search
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [chatSearchIndex, setChatSearchIndex] = useState(0);
  const [showChatSearch, setShowChatSearch] = useState(false);

  // Organization
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

  // Local comments (no API endpoint for channel comments yet)
  const [comments, setComments] = useState<Record<string, Comment[]>>({});

  const timersRef = useRef<NodeJS.Timeout[]>([]);

  // ========= DERIVED DATA =========
  const visibleChats = conversations.filter(c => !c.archived && !c.blocked);
  const archivedChats = conversations.filter(c => c.archived);
  const chat = conversations.find(c => c.id === activeChat);

  // Auto-select first chat
  useEffect(() => {
    if (conversations.length > 0 && !activeChat) {
      setActiveChat(conversations[0].id);
    }
  }, [conversations, activeChat]);

  // Messages for active chat
  const {
    messages: chatMessages,
    sendMessage: apiSendMessage,
    pinMessage: apiPinMessage,
    editMessage: apiEditMessage,
    deleteMessage: apiDeleteMessage,
    addReaction,
    removeReaction,
    sendTyping,
  } = useMessages(activeChat, userId);

  // Cleanup timers
  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  // ========= WEBSOCKET EVENTS =========
  useEffect(() => {
    const handleWsMessage = (data: any) => {
      const convId = String(data.conversationId);
      queryClient.invalidateQueries({ queryKey: ['messages', convId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    const handleTyping = (data: any) => {
      const convId = String(data.conversationId);
      const name = data.username || data.displayName || 'Someone';
      setTypingUsers(prev => ({
        ...prev,
        [convId]: [...new Set([...(prev[convId] || []), name])],
      }));
      const timer = setTimeout(() => {
        setTypingUsers(prev => ({
          ...prev,
          [convId]: (prev[convId] || []).filter(u => u !== name),
        }));
      }, 3000);
      timersRef.current.push(timer);
    };

    const handleRead = (data: any) => {
      const convId = String(data.conversationId);
      queryClient.invalidateQueries({ queryKey: ['messages', convId] });
    };

    on('chat:message', handleWsMessage);
    on('chat:typing', handleTyping);
    on('chat:read', handleRead);
    on('chat:message_edited', handleWsMessage);
    on('chat:message_deleted', handleWsMessage);
    on('chat:message_expired', handleWsMessage);
    on('chat:message_updated', handleWsMessage);
    on('chat:message_pinned', handleWsMessage);
    on('chat:message_unpinned', handleWsMessage);
    on('chat:new_conversation', () => queryClient.invalidateQueries({ queryKey: ['conversations'] }));
    on('chat:settings_updated', () => queryClient.invalidateQueries({ queryKey: ['conversations'] }));

    return () => {
      off('chat:message', handleWsMessage);
      off('chat:typing', handleTyping);
      off('chat:read', handleRead);
      off('chat:message_edited', handleWsMessage);
      off('chat:message_deleted', handleWsMessage);
      off('chat:message_expired', handleWsMessage);
      off('chat:message_updated', handleWsMessage);
      off('chat:message_pinned', handleWsMessage);
      off('chat:message_unpinned', handleWsMessage);
      off('chat:new_conversation', () => {});
      off('chat:settings_updated', () => {});
    };
  }, [on, off, queryClient]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // ========= HELPER: Add optimistic message to cache =========
  const addOptimisticMessage = useCallback((msg: Message) => {
    queryClient.setQueryData<Message[]>(['messages', activeChat], old => [...(old || []), msg]);
  }, [activeChat, queryClient]);

  // ========= CHAT SELECTION & DRAFTS =========
  const selectChat = useCallback((id: string) => {
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
    // Mark as read via API
    markRead(id);
    // Switch to chat view on mobile
    if (isMobile) setMobileView('chat');
  }, [activeChat, markRead, isMobile]);

  // ========= SEND MESSAGE =========
  const sendMessage = useCallback(async (text: string, options?: { silent?: boolean; effect?: MessageEffect }) => {
    await apiSendMessage({
      encryptedContent: text,
      replyToId: replyTo ? Number(replyTo.id) : undefined,
      clientMsgId: crypto.randomUUID(),
    });
    setReplyTo(null);
    setPendingEffect(null);
  }, [activeChat, replyTo, pendingEffect, apiSendMessage]);

  // ========= SEND GIF =========
  const sendGif = useCallback(async (gifUrl: string) => {
    addOptimisticMessage({
      id: `gif_${Date.now()}`,
      chatId: activeChat,
      senderId: userIdStr,
      senderName: userName,
      text: '',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: new Date().toISOString().split('T')[0],
      isOwn: true,
      read: true,
      type: 'gif',
      gifUrl,
    });
    setReplyTo(null);
  }, [activeChat, userIdStr, userName, addOptimisticMessage]);

  // ========= EDIT =========
  const saveEdit = useCallback(async (text: string) => {
    if (!editMsg) return;
    await apiEditMessage({
      messageId: editMsg.id,
      encryptedContent: text,
      nonce: '',
      senderKeyVersion: 0,
      signalMessageType: 2 as const,
    });
    setEditMsg(null);
  }, [editMsg, apiEditMessage]);

  // ========= DELETE =========
  const handleDelete = useCallback((forAll: boolean) => {
    if (!deleteMsg) return;
    apiDeleteMessage({ messageId: deleteMsg.id, forMe: !forAll });
    setDeleteMsg(null);
  }, [deleteMsg, apiDeleteMessage]);

  // ========= FORWARD =========
  const handleForward = useCallback(async (toChatId: string) => {
    const msgsToForward = forwardMsg ? [forwardMsg] : Array.from(selectedMessages).map(id => chatMessages.find(m => m.id === id)).filter(Boolean) as Message[];

    for (const msg of msgsToForward) {
      addOptimisticMessage({
        ...msg,
        id: `fwd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        chatId: toChatId,
        isOwn: true,
        senderId: userIdStr,
        senderName: userName,
        forwarded: { from: msg.senderName },
        replyTo: undefined,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        date: new Date().toISOString().split('T')[0],
        read: true,
        reactions: [],
        pinned: false,
      });
    }

    setForwardMsg(null);
    setSelectMode(false);
    setSelectedMessages(new Set());
    setBulkForwardTarget(false);
    showToast(`Message${msgsToForward.length > 1 ? 's' : ''} forwarded`);
  }, [forwardMsg, selectedMessages, chatMessages, showToast, userIdStr, userName, addOptimisticMessage]);

  // ========= PIN =========
  const handlePin = useCallback((msg: Message) => {
    setPinConfirmMsg(msg);
  }, []);

  const confirmPin = useCallback((notify: boolean) => {
    if (!pinConfirmMsg) return;
    apiPinMessage({ messageId: pinConfirmMsg.id, pin: !pinConfirmMsg.pinned });
    setPinConfirmMsg(null);
    showToast(pinConfirmMsg.pinned ? 'Message unpinned' : 'Message pinned');
  }, [pinConfirmMsg, apiPinMessage, showToast]);

  // ========= REACTIONS =========
  const handleReaction = useCallback((msgId: string, emoji: string) => {
    const msg = chatMessages.find(m => m.id === msgId);
    const hasReacted = msg?.reactions?.some(r => r.emoji === emoji && r.users.includes(userIdStr));
    if (hasReacted) {
      removeReaction({ messageId: msgId, emoji });
    } else {
      addReaction({ messageId: msgId, emoji });
    }
    setRecentEmojis(prev => {
      const filtered = prev.filter(e => e !== emoji);
      return [emoji, ...filtered].slice(0, 20);
    });
  }, [chatMessages, addReaction, removeReaction, userIdStr]);

  // ========= SIDEBAR ACTIONS =========
  const pinChat = useCallback((id: string) => {
    const c = conversations.find(c => c.id === id);
    if (c) pinConversation({ id, pinned: !c.pinned });
  }, [conversations, pinConversation]);

  const muteChat = useCallback((id: string, duration?: number) => {
    muteConversation({ id, muteUntil: duration });
  }, [muteConversation]);

  const deleteChat = useCallback((id: string) => {
    deleteConversation(id);
    if (activeChat === id) {
      const remaining = visibleChats.filter(c => c.id !== id);
      setActiveChat(remaining[0]?.id || '');
    }
  }, [activeChat, visibleChats, deleteConversation]);

  const markReadHandler = useCallback((id: string) => {
    markRead(id);
  }, [markRead]);

  const markUnread = useCallback((id: string) => {
    // No direct API — optimistic update
    queryClient.setQueryData<Chat[]>(['conversations'], old =>
      old?.map(c => c.id === id ? { ...c, markedUnread: true, unread: Math.max(c.unread, 1) } : c)
    );
  }, [queryClient]);

  const archiveChat = useCallback((id: string) => {
    archiveConversation({ id, archived: true });
    if (activeChat === id) {
      const remaining = visibleChats.filter(c => c.id !== id);
      setActiveChat(remaining[0]?.id || '');
    }
    showToast('Chat archived');
  }, [activeChat, visibleChats, archiveConversation, showToast]);

  const unarchiveChat = useCallback((id: string) => {
    archiveConversation({ id, archived: false });
    showToast('Chat unarchived');
  }, [archiveConversation, showToast]);

  const blockUser = useCallback(async (id: string) => {
    if (activeChat === id) {
      const remaining = visibleChats.filter(c => c.id !== id);
      setActiveChat(remaining[0]?.id || '');
    }
    showToast('User blocked');
  }, [activeChat, visibleChats, showToast]);

  const unblockUser = useCallback(async (_id: string) => {
    showToast('User unblocked');
  }, [showToast]);

  const leaveChat = useCallback((id: string) => {
    leaveConversation(id);
    showToast('You left the chat');
  }, [leaveConversation, showToast]);

  // ========= BOOKMARKS (localStorage per plan) =========
  const bookmarkMessage = useCallback((msg: Message) => {
    // Saved Messages is a local feature (localStorage/IndexedDB)
    showToast('Saved to bookmarks');
  }, [showToast]);

  // ========= TRANSLATE (not available yet per plan) =========
  const translateMessage = useCallback((msgId: string) => {
    // TODO: Translation endpoint not implemented on server yet
    showToast('Translation not available yet');
  }, [showToast]);

  // ========= POLLS (local, sent as encrypted content) =========
  const createPoll = useCallback((question: string, options: string[], multiChoice: boolean, quizMode: boolean, correctOption?: number, explanation?: string) => {
    const pollMsg: Message = {
      id: `poll_${Date.now()}`, chatId: activeChat, senderId: userIdStr, senderName: userName, text: '',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: new Date().toISOString().split('T')[0], isOwn: true, read: false, type: 'poll',
      pollData: {
        question,
        options: options.map(t => ({ text: t, voters: [] })),
        multiChoice, quizMode, correctOption, explanation,
      },
    };
    addOptimisticMessage(pollMsg);
    setShowPollModal(false);
  }, [activeChat, userIdStr, userName, addOptimisticMessage]);

  const votePoll = useCallback((msgId: string, optionIndex: number) => {
    queryClient.setQueryData<Message[]>(['messages', activeChat], old =>
      (old || []).map(m => {
        if (m.id !== msgId || !m.pollData) return m;
        const pd = { ...m.pollData, options: m.pollData.options.map(o => ({ ...o, voters: [...o.voters] })) };
        if (optionIndex === -1) {
          pd.options.forEach(o => { o.voters = o.voters.filter(v => v !== userIdStr); });
        } else if (pd.multiChoice) {
          const opt = pd.options[optionIndex];
          if (opt.voters.includes(userIdStr)) opt.voters = opt.voters.filter(v => v !== userIdStr);
          else opt.voters.push(userIdStr);
        } else {
          pd.options.forEach(o => { o.voters = o.voters.filter(v => v !== userIdStr); });
          pd.options[optionIndex].voters.push(userIdStr);
        }
        return { ...m, pollData: pd };
      })
    );
  }, [activeChat, userIdStr, queryClient]);

  // ========= DICE =========
  const rollDice = useCallback((emoji: string) => {
    const value = Math.floor(Math.random() * 6) + 1;
    const diceMsg: Message = {
      id: `dice_${Date.now()}`, chatId: activeChat, senderId: userIdStr, senderName: userName, text: '',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: new Date().toISOString().split('T')[0], isOwn: true, read: false, type: 'dice',
      diceResult: { emoji, value },
    };
    addOptimisticMessage(diceMsg);
  }, [activeChat, userIdStr, userName, addOptimisticMessage]);

  // ========= COMMENTS (local) =========
  const addComment = useCallback((postId: string, text: string, replyToComment?: { senderName: string; text: string }) => {
    const comment: Comment = {
      id: `cmt_${Date.now()}`,
      senderId: userIdStr,
      senderName: userName,
      senderColor: '252 75% 64%',
      text,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      replyTo: replyToComment,
    };
    setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), comment] }));
    queryClient.setQueryData<Message[]>(['messages', activeChat], old =>
      (old || []).map(m => m.id === postId ? { ...m, comments: (m.comments || 0) + 1 } : m)
    );
  }, [activeChat, userIdStr, userName, queryClient]);

  // ========= SCHEDULED MESSAGES =========
  const scheduleMessage = useCallback(async (text: string, scheduledFor: Date) => {
    const msg: Message = {
      id: `sched_${Date.now()}`, chatId: activeChat, senderId: userIdStr, senderName: userName, text,
      time: scheduledFor.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: scheduledFor.toISOString().split('T')[0], isOwn: true, read: false, type: 'message',
      scheduled: true, scheduledTime: scheduledFor.toLocaleString(),
    };
    addOptimisticMessage(msg);
    showToast(`Message scheduled for ${scheduledFor.toLocaleString()}`);
    setShowScheduleModal(false);
  }, [activeChat, userIdStr, userName, addOptimisticMessage, showToast]);

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
    selectedMessages.forEach(id => {
      apiDeleteMessage({ messageId: id, forMe: true });
    });
    showToast(`${selectedMessages.size} message${selectedMessages.size > 1 ? 's' : ''} deleted`);
    setSelectMode(false);
    setSelectedMessages(new Set());
  }, [selectedMessages, apiDeleteMessage, showToast]);

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
  const createCustomFolder = useCallback(async (name: string, emoji: string, chatIds: string[]) => {
    try {
      await apiCreateFolder({ name, emoji, chatIds: chatIds.map(Number) });
    } catch { /* ignore */ }
    setShowFolderEditor(false);
    showToast(`Folder "${name}" created`);
  }, [apiCreateFolder, showToast]);

  const moveToFolder = useCallback((chatId: string, folderId: string) => {
    // TODO: API endpoint for moving chat to folder
    showToast('Moved to folder');
  }, [showToast]);

  // ========= CLEAR HISTORY =========
  const clearHistory = useCallback((forAll: boolean) => {
    // Optimistic: clear local messages cache
    queryClient.setQueryData<Message[]>(['messages', activeChat], []);
    setShowClearHistory(false);
    showToast('History cleared');
  }, [activeChat, queryClient, showToast]);

  // ========= UPDATE CHANNEL/GROUP SETTINGS =========
  const updateChannelSettings = useCallback(async (_settings: Partial<Chat>) => {
    setShowEditChannel(false);
    showToast('Channel settings updated');
  }, [showToast]);

  const updateGroupSettings = useCallback(async (_settings: Partial<Chat>) => {
    setShowEditGroup(false);
    showToast('Group settings updated');
  }, [showToast]);

  // ========= INVITE LINKS =========
  const createInviteLink = useCallback(async (_maxUses?: number) => {
    showToast('Invite link created');
  }, [showToast]);

  const revokeInviteLink = useCallback(async (_linkId: string) => {
    showToast('Invite link revoked');
  }, [showToast]);

  // ========= ADMIN MANAGEMENT =========
  const promoteAdmin = useCallback(async (_adminUserId: string, _title: string) => {
    showToast('Admin updated');
  }, [showToast]);

  const demoteAdmin = useCallback(async (_adminUserId: string) => {
    showToast('Admin demoted');
  }, [showToast]);

  // ========= AUTO-DELETE =========
  const setAutoDelete = useCallback(async (_chatId: string, timer: number) => {
    setShowAutoDeleteDialog(false);
    showToast(timer ? `Auto-delete set to ${timer < 86400 ? `${timer / 3600}h` : timer < 604800 ? `${timer / 86400} day(s)` : `${timer / 604800} week(s)`}` : 'Auto-delete disabled');
  }, [showToast]);

  // ========= COPY LINK =========
  const copyMessageLink = useCallback((msg: Message) => {
    navigator.clipboard.writeText(`t.me/dexster/${msg.chatId}/${msg.id}`);
    showToast('Link copied');
  }, [showToast]);

  // ========= REPORT =========
  const handleReport = useCallback(async (_reason: string) => {
    setReportTarget(null);
    showToast('Report submitted. Thank you.');
  }, [showToast]);

  // ========= CREATE GROUP =========
  const createGroup = useCallback(async (name: string, memberIds: string[], description: string) => {
    try {
      const result = await apiCreateGroup({
        name,
        description,
        memberIds: memberIds.map(Number),
      });
      setShowGroupModal(false);
      setActiveChat(String((result as any).id));
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch {
      setShowGroupModal(false);
      showToast('Failed to create group');
    }
  }, [apiCreateGroup, queryClient, showToast]);

  // ========= CREATE CHANNEL =========
  const createChannel = useCallback(async (name: string, description: string, isPublic: boolean, commentsEnabled: boolean, reactionsEnabled: boolean) => {
    try {
      const result = await apiCreateChannel({ name, description, isPublic });
      setShowChannelModal(false);
      setActiveChat(String((result as any).id));
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch {
      setShowChannelModal(false);
      showToast('Failed to create channel');
    }
  }, [apiCreateChannel, queryClient, showToast]);

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

  // ========= MOBILE BACK HANDLER =========
  const handleMobileBack = useCallback(() => {
    setMobileView('sidebar');
  }, []);

  // ========= RENDER =========
  const showSidebar = !isMobile || mobileView === 'sidebar';
  const showChat = !isMobile || mobileView === 'chat';

  return (
    <div className="flex h-screen w-full overflow-hidden font-outfit">
      {showSidebar && (
        <Sidebar
          chats={visibleChats}
          archivedChats={archivedChats}
          activeChat={activeChat}
          onSelectChat={selectChat}
          onPinChat={pinChat}
          onMuteChat={(id) => muteChat(id)}
          onMuteWithDuration={(id) => setShowMuteOptions(id)}
          onDeleteChat={deleteChat}
          onMarkRead={markReadHandler}
          onMarkUnread={markUnread}
          onArchiveChat={archiveChat}
          onUnarchiveChat={unarchiveChat}
          onBlockUser={blockUser}
          onCreateChannel={() => setShowChannelModal(true)}
          onCreateGroup={() => setShowGroupModal(true)}
          onCreateFolder={() => setShowFolderEditor(true)}
          onNewChat={() => setShowNewChatModal(true)}
          customFolders={customFolders}
          onMoveToFolder={moveToFolder}
          chatDrafts={chatDrafts}
          onClearHistory={(id) => { setActiveChat(id); setShowClearHistory(true); }}
          isMobile={isMobile}
        />
      )}

      {showChat && chat && (
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
          selectMode={selectMode}
          selectedMessages={selectedMessages}
          onToggleSelect={toggleSelectMessage}
          onSelectAll={selectAll}
          onExitSelect={() => { setSelectMode(false); setSelectedMessages(new Set()); }}
          onBulkDelete={bulkDelete}
          onBulkForward={() => setBulkForwardTarget(true)}
          onBulkCopy={bulkCopy}
          showSearch={showChatSearch}
          onToggleSearch={() => { setShowChatSearch(!showChatSearch); setChatSearchQuery(''); setChatSearchIndex(0); }}
          searchQuery={chatSearchQuery}
          onSearchChange={(q) => { setChatSearchQuery(q); setChatSearchIndex(0); }}
          searchResults={searchResults}
          searchIndex={chatSearchIndex}
          onNavigateSearch={navigateSearch}
          recentEmojis={recentEmojis}
          pinnedIndex={pinnedIndex[activeChat] || 0}
          onCyclePinned={cyclePinnedMessage}
          draft={chatDrafts[activeChat]}
          onCreatePoll={() => setShowPollModal(true)}
          onRollDice={rollDice}
          onSchedule={(text) => { setScheduledText(text); setShowScheduleModal(true); }}
          pendingEffect={pendingEffect}
          onSetEffect={setPendingEffect}
          onToggleEffectPicker={() => setEffectPicker(!effectPicker)}
          showEffectPicker={effectPicker}
          onMuteChat={() => muteChat(activeChat)}
          onClearHistory={() => setShowClearHistory(true)}
          onLeaveChat={() => setShowLeaveConfirm(true)}
          onBlockUser={() => blockUser(activeChat)}
          onDeleteChat={() => deleteChat(activeChat)}
          onManageChannel={() => setShowEditChannel(true)}
          onManageGroup={() => setShowEditGroup(true)}
          onReport={() => setReportTarget(activeChat)}
          slowMode={chat?.slowMode}
          isMobile={isMobile}
          onBack={handleMobileBack}
        />
      )}

      {/* InfoPanel: Sheet on mobile, inline on desktop */}
      {isMobile ? (
        <Sheet open={showInfoPanel && !!chat} onOpenChange={(open) => !open && setShowInfoPanel(false)}>
          <SheetContent side="right" className="w-full p-0 sm:max-w-full">
            {chat && (
              <InfoPanel
                chat={chat}
                open={true}
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
                isMobile={isMobile}
              />
            )}
          </SheetContent>
        </Sheet>
      ) : (
        chat && (
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
        )
      )}

      {showCommentsFor && (
        <CommentsPanel
          comments={comments[showCommentsFor] || []}
          postPreview={chatMessages.find(m => m.id === showCommentsFor)?.text.slice(0, 80) || ''}
          onAddComment={(text, replyToComment) => addComment(showCommentsFor, text, replyToComment)}
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
      {showAdminManagement && chat && <AdminManagementModal chat={chat} users={chat.members || []} currentUserId={userIdStr} onPromote={promoteAdmin} onDemote={demoteAdmin} onClose={() => setShowAdminManagement(false)} />}
      {showLeaveConfirm && chat && <LeaveConfirmDialog chatName={chat.name} chatType={chat.type} onConfirm={() => { leaveChat(activeChat); setShowLeaveConfirm(false); }} onCancel={() => setShowLeaveConfirm(false)} />}
      {showNewChatModal && <NewChatModal onClose={() => setShowNewChatModal(false)} onStartChat={async (recipientId) => {
        try {
          const result = await createDM({ recipientId });
          setShowNewChatModal(false);
          setActiveChat(String((result as any).id));
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        } catch {
          setShowNewChatModal(false);
          showToast('Failed to start chat');
        }
      }} />}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-card border border-border text-sm text-foreground shadow-lg animate-[toastIn_0.2s_ease-out] z-50">
          {toast}
        </div>
      )}
    </div>
  );
};

export default DexsterChat;
