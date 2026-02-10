export type ChatType = 'personal' | 'group' | 'channel';

export interface User {
  id: string;
  name: string;
  avatar: string; // 2-letter initials
  color: string; // HSL color string for avatar bg + name in groups
  online: boolean;
  lastSeen?: string;
  phone?: string;
  username?: string;
  bio?: string;
}

export interface Reaction {
  emoji: string;
  users: string[]; // user ids, "me" for current user
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  time: string; // HH:MM
  date: string; // YYYY-MM-DD
  isOwn: boolean;
  read: boolean;
  edited?: boolean;
  replyTo?: {
    messageId: string;
    senderName: string;
    text: string;
  };
  forwarded?: {
    from: string;
  };
  pinned?: boolean;
  reactions?: Reaction[];
  type: 'message' | 'service';
  serviceText?: string;
  // channel-specific
  views?: number;
  comments?: number;
  shares?: number;
}

export interface Chat {
  id: string;
  name: string;
  type: ChatType;
  avatar: string;
  avatarColor: string;
  online?: boolean;
  lastSeen?: string;
  muted: boolean;
  pinned: boolean;
  unread: number;
  lastMessage: string;
  lastMessageSender?: string;
  lastTime: string;
  typing?: boolean;
  // channel-specific
  isPublic?: boolean;
  description?: string;
  subscriberCount?: number;
  commentsEnabled?: boolean;
  reactionsEnabled?: boolean;
  // group-specific
  memberCount?: number;
  members?: User[];
  // info panel
  phone?: string;
  username?: string;
  bio?: string;
}

export interface Comment {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  text: string;
  time: string;
}
