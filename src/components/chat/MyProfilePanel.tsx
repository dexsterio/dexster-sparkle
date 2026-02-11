import React, { useState, useRef } from 'react';
import { ArrowLeft, Camera, Copy, Eye, EyeOff, Check, Pencil } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';

interface MyProfilePanelProps {
  onClose: () => void;
}

const MyProfilePanel: React.FC<MyProfilePanelProps> = ({ onClose }) => {
  const { currentUser } = useAuth();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentUser?.avatarUrl || null);
  const [walletPublic, setWalletPublic] = useState(!currentUser?.hideWalletBalance);
  const [editingName, setEditingName] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const walletAddress = currentUser?.walletAddress || '7xKp...9mQz';
  const mockBalance = '12.847 SOL';

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setEditingName(false);
    setEditingBio(false);
  };

  return (
    <div className="fixed inset-0 z-[102] flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-[340px] max-w-full h-full bg-card flex flex-col animate-[slideInLeft_0.2s_ease-out] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative">
          {/* Cover gradient */}
          <div className="h-36 bg-primary" />

          {/* Back button */}
          <button
            onClick={onClose}
            className="absolute top-3 left-3 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors text-white"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Avatar */}
          <div className="absolute -bottom-12 left-5">
            <div
              className="relative w-24 h-24 rounded-full border-4 border-card bg-muted flex items-center justify-center cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-muted-foreground">
                  {(displayName || 'U')[0].toUpperCase()}
                </span>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={24} className="text-white" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pt-16 px-5 pb-5">
          {/* Display Name */}
          <div className="mb-5">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5 block">
              Display Name
            </label>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  maxLength={50}
                  className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button onClick={() => setEditingName(false)} className="p-1.5 rounded-lg hover:bg-dex-hover text-primary">
                  <Check size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between group">
                <span className="text-base font-semibold text-foreground">{displayName || 'Set a name'}</span>
                <button onClick={() => setEditingName(true)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-dex-hover text-muted-foreground transition-opacity">
                  <Pencil size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Bio */}
          <div className="mb-5">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5 block">
              Bio
            </label>
            {editingBio ? (
              <div className="flex flex-col gap-2">
                <textarea
                  autoFocus
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  maxLength={160}
                  rows={3}
                  className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{bio.length}/160</span>
                  <button onClick={() => setEditingBio(false)} className="p-1.5 rounded-lg hover:bg-dex-hover text-primary">
                    <Check size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between group">
                <span className="text-sm text-foreground/80">{bio || 'Add a bio...'}</span>
                <button onClick={() => setEditingBio(true)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-dex-hover text-muted-foreground transition-opacity">
                  <Pencil size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-border my-4" />

          {/* Wallet Section */}
          <div className="mb-5">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2 block">
              Wallet Address
            </label>
            <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2.5">
              <span className="text-sm font-mono text-foreground flex-1 truncate">{walletAddress}</span>
              <button
                onClick={handleCopyWallet}
                className="p-1.5 rounded-md hover:bg-dex-hover text-muted-foreground transition-colors"
              >
                {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Balance */}
          <div className="mb-5">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2 block">
              Balance
            </label>
            <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2.5">
              <span className="text-lg font-semibold text-foreground flex-1">
                {walletPublic ? mockBalance : '••••••'}
              </span>
            </div>
          </div>

          {/* Wallet Visibility Toggle */}
          <div className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-3">
            <div className="flex items-center gap-3">
              {walletPublic ? (
                <Eye size={18} className="text-muted-foreground" />
              ) : (
                <EyeOff size={18} className="text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">Public Wallet</p>
                <p className="text-xs text-muted-foreground">
                  {walletPublic ? 'Others can see your balance' : 'Balance hidden from others'}
                </p>
              </div>
            </div>
            <Switch checked={walletPublic} onCheckedChange={setWalletPublic} />
          </div>
        </div>

        {/* Save button */}
        <div className="px-5 py-4 border-t border-border">
          <button
            onClick={handleSave}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
          >
            {saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyProfilePanel;
