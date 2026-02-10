export type ChatType = 'personal' | 'group' | 'channel';

export interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
  online: boolean;
  lastSeen?: string;
  phone?: string;
  username?: string;
  bio?: string;
}

export interface Reaction {
  emoji: string;
  users: string[];
}

export interface PollOption {
  text: string;
  voters: string[];
}

export interface PollData {
  question: string;
  options: PollOption[];
  multiChoice: boolean;
  quizMode: boolean;
  correctOption?: number;
  explanation?: string;
  closed?: boolean;
}

export interface DiceResult {
  emoji: string;
  value: number;
}

export type MessageEffect = 'confetti' | 'fireworks' | 'hearts';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  time: string;
  date: string;
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
    hiddenSender?: boolean;
  };
  pinned?: boolean;
  reactions?: Reaction[];
  type: 'message' | 'service' | 'poll' | 'dice';
  serviceText?: string;
  views?: number;
  comments?: number;
  shares?: number;
  // New fields
  pollData?: PollData;
  diceResult?: DiceResult;
  effect?: MessageEffect;
  silentSend?: boolean;
  scheduled?: boolean;
  scheduledTime?: string;
  translated?: string;
  bookmarked?: boolean;
  autoDeleteAt?: number; // timestamp
}

export interface AdminPermissions {
  changeInfo: boolean;
  postMessages: boolean;
  editMessages: boolean;
  deleteMessages: boolean;
  banUsers: boolean;
  inviteUsers: boolean;
  pinMessages: boolean;
  manageVideoChats: boolean;
  stayAnonymous: boolean;
  addAdmins: boolean;
}

export interface AdminEntry {
  userId: string;
  title?: string;
  permissions: AdminPermissions;
}

export interface InviteLink {
  id: string;
  link: string;
  uses: number;
  maxUses?: number;
  expiresAt?: string;
  createdBy: string;
}

export interface GroupPermissions {
  sendMessages: boolean;
  sendMedia: boolean;
  sendStickers: boolean;
  sendPolls: boolean;
  addMembers: boolean;
  pinMessages: boolean;
  changeInfo: boolean;
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
  isPublic?: boolean;
  description?: string;
  subscriberCount?: number;
  commentsEnabled?: boolean;
  reactionsEnabled?: boolean;
  memberCount?: number;
  members?: User[];
  phone?: string;
  username?: string;
  bio?: string;
  // Organization
  archived?: boolean;
  blocked?: boolean;
  autoDeleteTimer?: number;
  folderId?: string;
  markedUnread?: boolean;
  draft?: string;
  muteUntil?: number;
  role?: 'owner' | 'admin' | 'member';
  // Channel/Group management
  signMessages?: boolean;
  autoTranslate?: boolean;
  accentColor?: string;
  directMessages?: boolean;
  discussionGroup?: string;
  inviteLinks?: InviteLink[];
  admins?: AdminEntry[];
  removedUsers?: string[];
  bannedUsers?: string[];
  recentActions?: { action: string; userId: string; timestamp: string }[];
  // Group-specific
  permissions?: GroupPermissions;
  slowMode?: number;
  chatHistoryForNewMembers?: boolean;
}

export interface Comment {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  text: string;
  time: string;
  replyTo?: { senderName: string; text: string };
  reactions?: Reaction[];
}

export interface CustomFolder {
  id: string;
  name: string;
  emoji: string;
  includedChatIds: string[];
  includeTypes?: ChatType[];
}

export interface ScheduledMessage extends Message {
  scheduledFor: number; // timestamp
}
