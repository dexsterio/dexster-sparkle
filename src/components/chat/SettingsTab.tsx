import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import {
  User, Bell, Shield, Palette, ChevronRight, LogOut, Edit3, Camera,
  Moon, Sun, Globe, Lock, Eye, MessageSquare
} from 'lucide-react';

type SettingsSection = 'main' | 'notifications' | 'privacy' | 'appearance' | 'profile';

const SettingsTab: React.FC = () => {
  const { currentUser } = useAuth();
  const [section, setSection] = useState<SettingsSection>('main');

  // Local preferences (persisted in localStorage)
  const [notifSound, setNotifSound] = useState(() =>
    localStorage.getItem('dexster_notif_sound') !== 'false'
  );
  const [notifPreview, setNotifPreview] = useState(() =>
    localStorage.getItem('dexster_notif_preview') !== 'false'
  );
  const [notifVibrate, setNotifVibrate] = useState(() =>
    localStorage.getItem('dexster_notif_vibrate') !== 'false'
  );
  const [readReceipts, setReadReceipts] = useState(() =>
    localStorage.getItem('dexster_read_receipts') !== 'false'
  );
  const [lastSeen, setLastSeen] = useState(() =>
    localStorage.getItem('dexster_last_seen') || 'everyone'
  );
  const [fontSize, setFontSize] = useState(() =>
    localStorage.getItem('dexster_font_size') || 'medium'
  );

  const togglePref = (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    localStorage.setItem(key, String(value));
  };

  if (section !== 'main') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sub-section header */}
        <button
          onClick={() => setSection('main')}
          className="flex items-center gap-2 px-4 py-3 border-b border-border text-sm font-medium text-primary"
        >
          <ChevronRight size={16} className="rotate-180" />
          {section === 'notifications' && 'Notifications'}
          {section === 'privacy' && 'Privacy & Security'}
          {section === 'appearance' && 'Appearance'}
          {section === 'profile' && 'Edit Profile'}
        </button>

        <div className="flex-1 overflow-y-auto">
          {/* Profile editing */}
          {section === 'profile' && (
            <ProfileEditor currentUser={currentUser} onBack={() => setSection('main')} />
          )}

          {/* Notifications */}
          {section === 'notifications' && (
            <div className="px-4 py-2">
              <ToggleRow
                icon={<Bell size={18} />}
                label="Notification sounds"
                value={notifSound}
                onChange={v => togglePref('dexster_notif_sound', v, setNotifSound)}
              />
              <ToggleRow
                icon={<Eye size={18} />}
                label="Message preview"
                value={notifPreview}
                onChange={v => togglePref('dexster_notif_preview', v, setNotifPreview)}
              />
              <ToggleRow
                icon={<MessageSquare size={18} />}
                label="Vibrate"
                value={notifVibrate}
                onChange={v => togglePref('dexster_notif_vibrate', v, setNotifVibrate)}
              />
            </div>
          )}

          {/* Privacy */}
          {section === 'privacy' && (
            <div className="px-4 py-2">
              <ToggleRow
                icon={<Eye size={18} />}
                label="Read receipts"
                value={readReceipts}
                onChange={v => togglePref('dexster_read_receipts', v, setReadReceipts)}
              />
              <div className="py-3 border-b border-border/30">
                <div className="flex items-center gap-3 mb-2">
                  <Lock size={18} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">Last seen</span>
                </div>
                <div className="flex gap-2 ml-8">
                  {['everyone', 'contacts', 'nobody'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => { setLastSeen(opt); localStorage.setItem('dexster_last_seen', opt); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        lastSeen === opt
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Appearance */}
          {section === 'appearance' && (
            <div className="px-4 py-2">
              <div className="py-3 border-b border-border/30">
                <div className="flex items-center gap-3 mb-3">
                  <Palette size={18} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">Theme</span>
                </div>
                <div className="flex gap-2 ml-8">
                  <ThemeButton icon={<Moon size={14} />} label="Dark" active />
                  <ThemeButton icon={<Sun size={14} />} label="Light" active={false} />
                </div>
              </div>

              <div className="py-3 border-b border-border/30">
                <div className="flex items-center gap-3 mb-3">
                  <Globe size={18} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">Font size</span>
                </div>
                <div className="flex gap-2 ml-8">
                  {['small', 'medium', 'large'].map(size => (
                    <button
                      key={size}
                      onClick={() => { setFontSize(size); localStorage.setItem('dexster_font_size', size); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        fontSize === size
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {/* Profile card */}
        <button
          onClick={() => setSection('profile')}
          className="w-full px-4 py-5 flex items-center gap-4 border-b border-border/30 hover:bg-dex-hover transition-colors text-left active:bg-primary/[0.1]"
        >
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-bold text-primary-foreground">
              {currentUser?.displayName?.slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-card">
              <Edit3 size={10} className="text-primary-foreground" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-foreground truncate">
              {currentUser?.displayName || currentUser?.username || 'User'}
            </h3>
            {currentUser?.username && (
              <p className="text-sm text-muted-foreground truncate">@{currentUser.username}</p>
            )}
            <p className="text-xs text-primary mt-0.5">Tap to edit profile</p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>

        {/* Menu items */}
        <div className="py-2">
          <SettingsMenuItem
            icon={<Bell size={20} className="text-primary" />}
            label="Notifications"
            subtitle="Sounds, previews, vibration"
            onClick={() => setSection('notifications')}
          />
          <SettingsMenuItem
            icon={<Shield size={20} className="text-primary" />}
            label="Privacy & Security"
            subtitle="Read receipts, last seen, blocked users"
            onClick={() => setSection('privacy')}
          />
          <SettingsMenuItem
            icon={<Palette size={20} className="text-primary" />}
            label="Appearance"
            subtitle="Theme, font size, colors"
            onClick={() => setSection('appearance')}
          />
        </div>

        {/* Logout */}
        <div className="py-2 border-t border-border/30">
          <button className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-dex-hover transition-colors text-left">
            <LogOut size={20} className="text-destructive" />
            <span className="text-sm font-medium text-destructive">Log Out</span>
          </button>
        </div>

        {/* Version */}
        <div className="px-4 py-4 text-center">
          <span className="text-[10px] text-muted-foreground/50">Dexster v1.0.0</span>
        </div>
      </div>
    </div>
  );
};

const SettingsMenuItem: React.FC<{ icon: React.ReactNode; label: string; subtitle: string; onClick: () => void }> = ({ icon, label, subtitle, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-dex-hover transition-colors text-left active:bg-primary/[0.1]"
  >
    {icon}
    <div className="flex-1 min-w-0">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
    <ChevronRight size={16} className="text-muted-foreground" />
  </button>
);

const ToggleRow: React.FC<{ icon: React.ReactNode; label: string; value: boolean; onChange: (v: boolean) => void }> = ({ icon, label, value, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-border/30">
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-sm text-foreground">{label}</span>
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full transition-colors relative ${value ? 'bg-primary' : 'bg-muted'}`}
    >
      <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${value ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
    </button>
  </div>
);

const ThemeButton: React.FC<{ icon: React.ReactNode; label: string; active: boolean }> = ({ icon, label, active }) => (
  <button
    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
      active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
    }`}
  >
    {icon}
    {label}
  </button>
);

// Profile editor component
const ProfileEditor: React.FC<{ currentUser: any; onBack: () => void }> = ({ currentUser }) => {
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/profile/me', { displayName, bio });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
    setSaving(false);
  };

  return (
    <div className="px-4 py-4">
      {/* Avatar */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold text-primary-foreground">
            {displayName?.slice(0, 2).toUpperCase() || 'U'}
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-card hover:bg-primary/90 transition-colors">
            <Camera size={14} className="text-primary-foreground" />
          </button>
        </div>
      </div>

      {/* Display name */}
      <div className="mb-4">
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Display Name</label>
        <input
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="Your display name"
          className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
          maxLength={50}
        />
      </div>

      {/* Username (read-only) */}
      <div className="mb-4">
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Username</label>
        <input
          value={currentUser?.username || ''}
          disabled
          className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border/30 text-sm text-muted-foreground"
        />
      </div>

      {/* Bio */}
      <div className="mb-6">
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bio</label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="Tell something about yourself..."
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          maxLength={200}
        />
        <span className="text-[10px] text-muted-foreground">{bio.length}/200</span>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${
          saved
            ? 'bg-dex-online text-white'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        } ${saving ? 'opacity-50' : ''}`}
      >
        {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
};

export default SettingsTab;
