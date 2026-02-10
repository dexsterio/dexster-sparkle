import React, { useState, useCallback, useEffect } from 'react';
import { Chat, Message } from '@/types/chat';
import { initialChats, initialMessages } from '@/data/mockData';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import InfoPanel from './InfoPanel';
import { DeleteDialog, ForwardModal, CreateChannelModal } from './Modals';

const DexsterChat: React.FC = () => {
  const [activeChat, setActiveChat] = useState('alex');
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [messages, setMessages] = useState<Record<string, Message[]>>(initialMessages);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editMsg, setEditMsg] = useState<Message | null>(null);
  const [deleteMsg, setDeleteMsg] = useState<Message | null>(null);
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [toast, setToast] = useState<string | null>(null);

  const chat = chats.find(c => c.id === activeChat)!;
  const chatMessages = messages[activeChat] || [];

  // Simulate typing
  useEffect(() => {
    if (activeChat === 'alex') {
      const t1 = setTimeout(() => setTypingUsers(prev => ({ ...prev, alex: ['Alex Volkov'] })), 3000);
      const t2 = setTimeout(() => setTypingUsers(prev => ({ ...prev, alex: [] })), 6000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [activeChat]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const selectChat = useCallback((id: string) => {
    setActiveChat(id);
    setShowInfoPanel(false);
    setReplyTo(null);
    setEditMsg(null);
    // Mark as read
    setChats(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
  }, []);

  const sendMessage = useCallback((text: string) => {
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
    };
    setMessages(prev => ({ ...prev, [activeChat]: [...(prev[activeChat] || []), newMsg] }));
    setChats(prev => prev.map(c => c.id === activeChat ? { ...c, lastMessage: text, lastMessageSender: 'You', lastTime: newMsg.time } : c));
    setReplyTo(null);
  }, [activeChat, replyTo]);

  const saveEdit = useCallback((text: string) => {
    if (!editMsg) return;
    setMessages(prev => ({
      ...prev,
      [activeChat]: prev[activeChat].map(m => m.id === editMsg.id ? { ...m, text, edited: true } : m),
    }));
    setEditMsg(null);
  }, [activeChat, editMsg]);

  const handleDelete = useCallback((forAll: boolean) => {
    if (!deleteMsg) return;
    setMessages(prev => ({
      ...prev,
      [activeChat]: prev[activeChat].filter(m => m.id !== deleteMsg.id),
    }));
    setDeleteMsg(null);
  }, [activeChat, deleteMsg]);

  const handleForward = useCallback((toChatId: string) => {
    if (!forwardMsg) return;
    const fwd: Message = {
      ...forwardMsg,
      id: `fwd_${Date.now()}`,
      chatId: toChatId,
      isOwn: true,
      senderId: 'me',
      senderName: 'You',
      forwarded: { from: forwardMsg.senderName },
      replyTo: undefined,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: '2026-02-10',
      read: false,
      reactions: [],
    };
    setMessages(prev => ({ ...prev, [toChatId]: [...(prev[toChatId] || []), fwd] }));
    setForwardMsg(null);
    showToast('Message forwarded');
  }, [forwardMsg]);

  const handlePin = useCallback((msg: Message) => {
    setMessages(prev => ({
      ...prev,
      [activeChat]: prev[activeChat].map(m => m.id === msg.id ? { ...m, pinned: !m.pinned } : m),
    }));
  }, [activeChat]);

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
  }, [activeChat]);

  const pinChat = useCallback((id: string) => {
    setChats(prev => prev.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c));
  }, []);

  const muteChat = useCallback((id: string) => {
    setChats(prev => prev.map(c => c.id === id ? { ...c, muted: !c.muted } : c));
  }, []);

  const deleteChat = useCallback((id: string) => {
    setChats(prev => prev.filter(c => c.id !== id));
    if (activeChat === id && chats.length > 1) {
      setActiveChat(chats.find(c => c.id !== id)?.id || '');
    }
  }, [activeChat, chats]);

  const markRead = useCallback((id: string) => {
    setChats(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
  }, []);

  const createChannel = useCallback((name: string, description: string, isPublic: boolean, comments: boolean, reactions: boolean) => {
    const id = `ch_${Date.now()}`;
    const newChat: Chat = {
      id, name, type: 'channel', avatar: name.slice(0, 2).toUpperCase(), avatarColor: '252 75% 64%',
      muted: false, pinned: false, unread: 0, lastMessage: 'Channel created', lastTime: 'now',
      isPublic, description, subscriberCount: 1, commentsEnabled: comments, reactionsEnabled: reactions,
    };
    setChats(prev => [...prev, newChat]);
    setMessages(prev => ({ ...prev, [id]: [{ id: `s_${Date.now()}`, chatId: id, senderId: 'system', senderName: '', text: '', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), date: '2026-02-10', isOwn: false, read: true, type: 'service', serviceText: 'Channel created' }] }));
    setShowChannelModal(false);
    setActiveChat(id);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showChannelModal) setShowChannelModal(false);
        else if (deleteMsg) setDeleteMsg(null);
        else if (forwardMsg) setForwardMsg(null);
        else if (showInfoPanel) setShowInfoPanel(false);
        else if (editMsg) setEditMsg(null);
        else if (replyTo) setReplyTo(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showChannelModal, deleteMsg, forwardMsg, showInfoPanel, editMsg, replyTo]);

  return (
    <div className="flex h-screen w-full overflow-hidden font-outfit">
      <Sidebar
        chats={chats}
        activeChat={activeChat}
        onSelectChat={selectChat}
        onPinChat={pinChat}
        onMuteChat={muteChat}
        onDeleteChat={deleteChat}
        onMarkRead={markRead}
        onCreateChannel={() => setShowChannelModal(true)}
      />

      {chat && (
        <ChatArea
          chat={chat}
          messages={chatMessages}
          onSendMessage={sendMessage}
          onReply={setReplyTo}
          onEdit={setEditMsg}
          onDelete={setDeleteMsg}
          onForward={setForwardMsg}
          onPin={handlePin}
          onReaction={handleReaction}
          replyTo={replyTo}
          editMsg={editMsg}
          onCancelReply={() => setReplyTo(null)}
          onCancelEdit={() => setEditMsg(null)}
          onSaveEdit={saveEdit}
          onHeaderClick={() => setShowInfoPanel(!showInfoPanel)}
          typingUsers={typingUsers[activeChat] || []}
        />
      )}

      {chat && (
        <InfoPanel
          chat={chat}
          open={showInfoPanel}
          onClose={() => setShowInfoPanel(false)}
          onMute={() => muteChat(activeChat)}
        />
      )}

      {deleteMsg && (
        <DeleteDialog
          message={deleteMsg}
          chatName={chat.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteMsg(null)}
        />
      )}

      {forwardMsg && (
        <ForwardModal
          chats={chats}
          onForward={handleForward}
          onCancel={() => setForwardMsg(null)}
        />
      )}

      {showChannelModal && (
        <CreateChannelModal
          onClose={() => setShowChannelModal(false)}
          onCreate={createChannel}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-card border border-border text-sm text-foreground shadow-lg animate-[toastIn_0.2s_ease-out] z-50">
          {toast}
        </div>
      )}
    </div>
  );
};

export default DexsterChat;
