import { Chat, Message, User, Comment } from '@/types/chat';

export const currentUser: User = {
  id: 'me',
  name: 'You',
  avatar: 'YO',
  color: '252 75% 64%',
  online: true,
  phone: '+46 70 987 6543',
  username: '@you',
  bio: 'Building things with code',
};

export const users: Record<string, User> = {
  alex: { id: 'alex', name: 'Alex Volkov', avatar: 'AV', color: '252 75% 64%', online: true, phone: '+46 70 123 4567', username: '@alexvolkov', bio: 'Full-stack developer. Coffee enthusiast.' },
  sarah: { id: 'sarah', name: 'Sarah Chen', avatar: 'SC', color: '340 65% 60%', online: false, lastSeen: 'last seen 2 hours ago', phone: '+46 73 234 5678', username: '@sarahchen', bio: 'Designer & photographer 📸' },
  mike: { id: 'mike', name: 'Mike Torres', avatar: 'MT', color: '160 63% 40%', online: true, phone: '+46 76 345 6789', username: '@miketorres', bio: 'DevOps engineer' },
  emma: { id: 'emma', name: 'Emma Wilson', avatar: 'EW', color: '30 80% 55%', online: false, lastSeen: 'last seen yesterday', phone: '+46 72 456 7890', username: '@emmawilson', bio: 'Product manager at StartupCo' },
  bot: { id: 'bot', name: 'Dexster Bot', avatar: 'DB', color: '200 70% 50%', online: true, username: '@dexsterbot', bio: 'I help with things!' },
};

export const initialChats: Chat[] = [
  { id: 'saved', name: 'Saved Messages', type: 'personal', avatar: '🔖', avatarColor: '252 75% 64%', muted: false, pinned: true, unread: 0, lastMessage: 'Bookmark messages here', lastTime: '', role: 'owner' },
  { id: 'alex', name: 'Alex Volkov', type: 'personal', avatar: 'AV', avatarColor: '252 75% 64%', online: true, muted: false, pinned: true, unread: 2, lastMessage: 'Check out this new feature I built!', lastTime: '14:32', phone: '+46 70 123 4567', username: '@alexvolkov', bio: 'Full-stack developer. Coffee enthusiast.' },
  { id: 'sarah', name: 'Sarah Chen', type: 'personal', avatar: 'SC', avatarColor: '340 65% 60%', online: false, lastSeen: 'last seen 2 hours ago', muted: false, pinned: false, unread: 0, lastMessage: 'The design looks great!', lastTime: '12:15', phone: '+46 73 234 5678', username: '@sarahchen', bio: 'Designer & photographer 📸' },
  { id: 'mike', name: 'Mike Torres', type: 'personal', avatar: 'MT', avatarColor: '160 63% 40%', online: true, muted: true, pinned: false, unread: 5, lastMessage: 'Can you review my PR?', lastTime: '11:44', phone: '+46 76 345 6789', username: '@miketorres', bio: 'DevOps engineer' },
  { id: 'emma', name: 'Emma Wilson', type: 'personal', avatar: 'EW', avatarColor: '30 80% 55%', online: false, lastSeen: 'last seen yesterday', muted: false, pinned: false, unread: 0, lastMessage: 'Let\'s sync tomorrow morning', lastMessageSender: 'You', lastTime: 'Yesterday', phone: '+46 72 456 7890', username: '@emmawilson', bio: 'Product manager at StartupCo' },
  { id: 'devops', name: 'DevOps Hub', type: 'group', avatar: 'DH', avatarColor: '200 70% 50%', muted: false, pinned: true, unread: 12, lastMessage: 'Pipeline failed on staging', lastMessageSender: 'Mike', lastTime: '13:58', memberCount: 8, members: [users.alex, users.sarah, users.mike, users.emma], bio: 'DevOps team discussions', role: 'admin' },
  { id: 'techblog', name: 'Tech Insider', type: 'channel', avatar: 'TI', avatarColor: '15 85% 55%', muted: false, pinned: false, unread: 3, lastMessage: 'React 20 is here — everything you need to know', lastTime: '10:30', isPublic: true, description: 'Latest tech news and insights. Updated daily.', subscriberCount: 12847, commentsEnabled: true, reactionsEnabled: true, username: '@techinsider' },
  { id: 'design', name: 'UI/UX Designers', type: 'channel', avatar: 'UX', avatarColor: '280 65% 55%', muted: false, pinned: false, unread: 0, lastMessage: 'New Figma plugin for dark mode testing', lastTime: 'Yesterday', isPublic: false, description: 'A private community for UI/UX designers.', subscriberCount: 943, commentsEnabled: true, reactionsEnabled: true },
  // Archived chats
  { id: 'oldproject', name: 'Old Project', type: 'group', avatar: 'OP', avatarColor: '120 40% 40%', muted: true, pinned: false, unread: 0, lastMessage: 'Project completed!', lastTime: 'Jan 15', archived: true, memberCount: 4 },
  { id: 'newsletter', name: 'Weekly Digest', type: 'channel', avatar: 'WD', avatarColor: '45 70% 50%', muted: true, pinned: false, unread: 8, lastMessage: 'This week in tech...', lastTime: 'Jan 20', archived: true, isPublic: true, subscriberCount: 5400 },
];

export const initialMessages: Record<string, Message[]> = {
  saved: [
    { id: 'sv1', chatId: 'saved', senderId: 'me', senderName: 'You', text: 'Important link: https://react.dev/blog', time: '09:00', date: '2026-02-08', isOwn: true, read: true, type: 'message', bookmarked: true },
    { id: 'sv2', chatId: 'saved', senderId: 'me', senderName: 'You', text: 'Meeting notes from standup:\n> Discussed deployment timeline\n> Need to review PR #42\n> Sprint ends Friday', time: '10:30', date: '2026-02-09', isOwn: true, read: true, type: 'message', bookmarked: true },
  ],
  alex: [
    { id: 'a1', chatId: 'alex', senderId: 'alex', senderName: 'Alex Volkov', text: 'Hey! How\'s the project going?', time: '14:20', date: '2026-02-10', isOwn: false, read: true, type: 'message' },
    { id: 'a2', chatId: 'alex', senderId: 'me', senderName: 'You', text: 'Pretty good! Just finished the auth module.', time: '14:22', date: '2026-02-10', isOwn: true, read: true, type: 'message' },
    { id: 'a3', chatId: 'alex', senderId: 'alex', senderName: 'Alex Volkov', text: 'Nice! I\'ve been working on the real-time sync. Got ||websockets|| working with the new protocol.', time: '14:25', date: '2026-02-10', isOwn: false, read: true, type: 'message', reactions: [{ emoji: '🔥', users: ['me'] }, { emoji: '👍', users: ['me', 'alex'] }] },
    { id: 'a4', chatId: 'alex', senderId: 'me', senderName: 'You', text: 'That\'s awesome! Can you share the implementation?', time: '14:28', date: '2026-02-10', isOwn: true, read: true, type: 'message', replyTo: { messageId: 'a3', senderName: 'Alex Volkov', text: 'Nice! I\'ve been working on the real-time sync...' } },
    { id: 'a5', chatId: 'alex', senderId: 'alex', senderName: 'Alex Volkov', text: 'Sure! Here\'s the gist:\n```\nconst ws = new WebSocket(url);\nws.onmessage = (e) => {\n  handleData(JSON.parse(e.data));\n};\n```\nI\'ll send you the full code later.', time: '14:30', date: '2026-02-10', isOwn: false, read: true, type: 'message', edited: true },
    { id: 'a6', chatId: 'alex', senderId: 'alex', senderName: 'Alex Volkov', text: 'Check out this new feature I built!', time: '14:32', date: '2026-02-10', isOwn: false, read: false, type: 'message', pinned: true },
    { id: 'a7', chatId: 'alex', senderId: 'alex', senderName: 'Alex Volkov', text: 'Also check #typescript and @sarahchen\'s blog post about __design systems__. Link: https://design-systems.dev/article', time: '14:35', date: '2026-02-10', isOwn: false, read: false, type: 'message' },
  ],
  sarah: [
    { id: 's0', chatId: 'sarah', senderId: 'me', senderName: 'You', text: 'Hey Sarah, can you take a look at the new dashboard?', time: '11:50', date: '2026-02-10', isOwn: true, read: true, type: 'message' },
    { id: 's1', chatId: 'sarah', senderId: 'sarah', senderName: 'Sarah Chen', text: 'Of course! Let me check it out.', time: '12:00', date: '2026-02-10', isOwn: false, read: true, type: 'message' },
    { id: 's2', chatId: 'sarah', senderId: 'sarah', senderName: 'Sarah Chen', text: 'The design looks great! Love the color palette you chose. The spacing could use a bit of tweaking on mobile though.', time: '12:15', date: '2026-02-10', isOwn: false, read: true, type: 'message', reactions: [{ emoji: '❤️', users: ['me'] }] },
  ],
  mike: [
    { id: 'm1', chatId: 'mike', senderId: 'mike', senderName: 'Mike Torres', text: 'Hey, quick question about the CI pipeline', time: '11:30', date: '2026-02-10', isOwn: false, read: true, type: 'message' },
    { id: 'm2', chatId: 'mike', senderId: 'me', senderName: 'You', text: 'Sure, what\'s up?', time: '11:35', date: '2026-02-10', isOwn: true, read: true, type: 'message' },
    { id: 'm3', chatId: 'mike', senderId: 'mike', senderName: 'Mike Torres', text: 'Can you review my PR? I refactored the Docker setup.', time: '11:44', date: '2026-02-10', isOwn: false, read: false, type: 'message' },
  ],
  emma: [
    { id: 'e1', chatId: 'emma', senderId: 'emma', senderName: 'Emma Wilson', text: 'How\'s the sprint going?', time: '16:00', date: '2026-02-09', isOwn: false, read: true, type: 'message' },
    { id: 'e2', chatId: 'emma', senderId: 'me', senderName: 'You', text: 'On track! Should finish by Friday.', time: '16:15', date: '2026-02-09', isOwn: true, read: true, type: 'message' },
    { id: 'e3', chatId: 'emma', senderId: 'me', senderName: 'You', text: 'Let\'s sync tomorrow morning', time: '16:20', date: '2026-02-09', isOwn: true, read: true, type: 'message' },
  ],
  devops: [
    { id: 'd0', chatId: 'devops', senderId: 'system', senderName: '', text: '', time: '09:00', date: '2026-02-10', isOwn: false, read: true, type: 'service', serviceText: 'Alex Volkov created the group' },
    { id: 'd1', chatId: 'devops', senderId: 'alex', senderName: 'Alex Volkov', text: 'Morning everyone! Quick standup — what\'s everyone working on?', time: '09:15', date: '2026-02-10', isOwn: false, read: true, type: 'message' },
    { id: 'd2', chatId: 'devops', senderId: 'sarah', senderName: 'Sarah Chen', text: 'Working on the monitoring dashboard today.', time: '09:18', date: '2026-02-10', isOwn: false, read: true, type: 'message' },
    { id: 'd3', chatId: 'devops', senderId: 'me', senderName: 'You', text: 'I\'ll be fixing the auth service memory leak.', time: '09:22', date: '2026-02-10', isOwn: true, read: true, type: 'message' },
    { id: 'd_poll', chatId: 'devops', senderId: 'alex', senderName: 'Alex Volkov', text: '', time: '10:00', date: '2026-02-10', isOwn: false, read: true, type: 'poll', pollData: { question: '🗳 When should we deploy v2.0?', options: [{ text: 'This Friday', voters: ['me', 'sarah'] }, { text: 'Next Monday', voters: ['alex', 'mike'] }, { text: 'After more testing', voters: ['emma'] }], multiChoice: false, quizMode: false } },
    { id: 'd4', chatId: 'devops', senderId: 'mike', senderName: 'Mike Torres', text: 'Pipeline failed on staging — looking into it now.', time: '13:58', date: '2026-02-10', isOwn: false, read: false, type: 'message', reactions: [{ emoji: '😮', users: ['alex'] }, { emoji: '👍', users: ['me', 'sarah'] }] },
    { id: 'd5', chatId: 'devops', senderId: 'system', senderName: '', text: '', time: '14:00', date: '2026-02-10', isOwn: false, read: true, type: 'service', serviceText: 'Mike Torres pinned a message' },
    { id: 'd_dice', chatId: 'devops', senderId: 'mike', senderName: 'Mike Torres', text: '', time: '14:05', date: '2026-02-10', isOwn: false, read: true, type: 'dice', diceResult: { emoji: '🎲', value: 4 } },
  ],
  techblog: [
    { id: 't1', chatId: 'techblog', senderId: 'techblog', senderName: 'Tech Insider', text: '🚀 **React 20 is here** — everything you need to know\n\nThe React team just released version 20 with major improvements to the compiler, new hooks, and a completely revamped Suspense model. Here\'s our breakdown of what changed and why it matters.\n\n> This is the biggest React release since hooks were introduced in v16.8', time: '10:30', date: '2026-02-10', isOwn: false, read: false, type: 'message', views: 8420, comments: 34, shares: 156, pinned: true, reactions: [{ emoji: '🔥', users: ['me', 'alex', 'sarah'] }, { emoji: '👍', users: ['alex', 'mike'] }] },
    { id: 't2', chatId: 'techblog', senderId: 'techblog', senderName: 'Tech Insider', text: '💡 **5 VS Code Extensions** you didn\'t know you needed\n\nBoost your productivity with these hidden gems.', time: '08:15', date: '2026-02-10', isOwn: false, read: false, type: 'message', views: 3200, comments: 12, shares: 45 },
    { id: 't3', chatId: 'techblog', senderId: 'techblog', senderName: 'Tech Insider', text: '🔒 Security alert: New vulnerability found in popular npm packages. Update your dependencies ASAP.\n\nAffected packages: #security #npm #vulnerability\nhttps://cve.mitre.org/advisory/2026-001', time: '18:00', date: '2026-02-09', isOwn: false, read: true, type: 'message', views: 45200, comments: 89, shares: 1200, reactions: [{ emoji: '😮', users: ['me'] }] },
  ],
  design: [
    { id: 'ds1', chatId: 'design', senderId: 'design', senderName: 'UI/UX Designers', text: '🎨 New Figma plugin for dark mode testing — automatically generates dark variants of your designs.', time: '15:00', date: '2026-02-09', isOwn: false, read: true, type: 'message', views: 512, comments: 7, shares: 23 },
  ],
};

export const initialComments: Record<string, Comment[]> = {
  t1: [
    { id: 'c1', senderId: 'alex', senderName: 'Alex Volkov', senderColor: '252 75% 64%', text: 'Finally! The new compiler is insane.', time: '10:45' },
    { id: 'c2', senderId: 'sarah', senderName: 'Sarah Chen', senderColor: '340 65% 60%', text: 'The Suspense improvements are what I\'ve been waiting for.', time: '11:02' },
    { id: 'c3', senderId: 'mike', senderName: 'Mike Torres', senderColor: '160 63% 40%', text: 'Anyone tested this in production yet?', time: '11:15', replyTo: { senderName: 'Alex Volkov', text: 'Finally! The new compiler is insane.' } },
  ],
  t2: [
    { id: 'c4', senderId: 'emma', senderName: 'Emma Wilson', senderColor: '30 80% 55%', text: 'Number 3 is a game changer!', time: '08:30' },
  ],
};

export const EMOJI_DATA: Record<string, string[]> = {
  'Smileys': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥴','😵','🤯','🥱','😤','😡','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖'],
  'Gestures': ['👍','👎','👊','✊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👋','🤚','🖐','✋','🖖','🫱','🫲','🫳','🫴','💪','🦾','🖊️','✍️','🫶'],
  'Hearts': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟'],
  'Animals': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷','🦂','🐢','🐍','🦎','🦖','🦕'],
  'Food': ['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐','🥖','🍞','🥨','🥯','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗'],
  'Activities': ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸','🥌','🎿','⛷','🏂','🪂','🏋️','🤸','🤺','🏇','⛑️','🎮','🎲','🎯','🎳','🎰'],
  'Travel': ['🚗','🚕','🚙','🚌','🚎','🏎','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🏍','🛵','🚲','🛴','🛺','🚔','🚍','🚘','🚖','🛞','🚡','🚠','🚟','🚃','🚋','🚞','🚝','🚄','🚅','🚈','🚂','🚆','🚇','🚊','🚉','✈️','🛫','🛬','🛩','💺','🛰','🚀','🛸','🚁','🛶','⛵','🚤','🛥','🛳','⛴','🚢'],
  'Objects': ['⌚','📱','📲','💻','⌨️','🖥','🖨','🖱','🖲','🕹','🗜','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽','🎞','📞','☎️','📟','📠','📺','📻','🎙','🎚','🎛','🧭','⏱','⏲','⏰','🕰','⌛','📡','🔋','🪫','🔌','💡','🔦','🕯','🪔','🧯','🛢','💸','💵','💴','💶','💷','🪙','💰','💳','🔑','🗝','🔐','🔏','🔒','🔓'],
  'Symbols': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💯','💢','💥','💫','💦','💨','🕳','💣','💬','👁️‍🗨️','🗨','🗯','💭','💤','🏳️','🏴','🏁','🚩','🏳️‍🌈','🏳️‍⚧️','✅','❌','❓','❕','❗','⭕','🛑','⛔','📛','🚫','💮','♻️','✳️','❇️','🔆','🔅','⚜️','🔱','🎵','🎶'],
};
