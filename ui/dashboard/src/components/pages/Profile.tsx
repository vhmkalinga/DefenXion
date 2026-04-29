import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Shield, Award, Activity, Camera, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { getMe, updateMe } from '../../services/api';

const DEFAULT_AVATARS = ['admin', 'felix', 'aneka', 'jack', 'oliver', 'leo', 'salem', 'milo', 'cyber', 'shield', 'shadow', 'neon'];

const activityHistory = [
  { action: 'Generated security report', timestamp: '2 hours ago', type: 'report' },
  { action: 'Updated firewall rules', timestamp: '5 hours ago', type: 'config' },
  { action: 'Blocked DDoS attack', timestamp: '1 day ago', type: 'threat' },
  { action: 'Trained AI model v3.2', timestamp: '3 days ago', type: 'model' },
  { action: 'Added new team member', timestamp: '1 week ago', type: 'user' },
];

const achievements = [
  { title: 'Test Execution', description: 'Passed 1000+ threat scenarios', icon: Shield, color: '#FF4D4D' },
  { title: 'Model Accuracy', description: 'Achieved 95% detection rate', icon: Award, color: '#FFA657' },
  { title: 'Data Processing', description: 'Processed 50,000+ test packets', icon: Activity, color: '#58A6FF' },
];

export function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [profile, setProfile] = useState<any>({
    username: '...',
    role: '...',
    full_name: '...',
    email: '...',
    phone: '...',
    location: '...',
    member_since: '...'
  });
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    avatar: ''
  });

  useEffect(() => {
    getMe().then(data => {
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        location: data.location || '',
        avatar: data.avatar || ''
      });
    }).catch(err => console.error("Failed to fetch profile", err));
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error('Image is too large (max 2MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
        setIsAvatarModalOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectDefaultAvatar = (seed: string) => {
    setFormData(prev => ({ ...prev, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}` }));
    setIsAvatarModalOpen(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMe(formData);
      setProfile((prev: any) => ({ ...prev, ...formData }));
      setIsEditing(false);
      window.dispatchEvent(new Event('profileUpdated'));
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <h2 className="text-[#E6EDF3] mb-8">Profile</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D]">
            <div className="flex items-start gap-6 mb-6">
              <div className="relative group shrink-0">
                <Avatar className="w-24 h-24 border border-[#30363D]">
                  <AvatarImage src={formData.avatar || profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username || 'admin'}`} />
                  <AvatarFallback className="bg-[#0D1117] text-[#E6EDF3] text-2xl">
                    {profile.full_name?.charAt(0) || profile.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <button 
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]" 
                    title="Change Avatar"
                  >
                    <Camera className="w-5 h-5 text-white mb-1" />
                    <span className="text-[10px] text-white font-medium uppercase tracking-wider">Change</span>
                  </button>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-[#E6EDF3] mb-2">{profile.full_name || profile.username}</h3>
                <p className="text-[#7D8590] mb-4 capitalize">{profile.role}</p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="border-[#3FB950] text-[#3FB950]">
                    Active
                  </Badge>
                </div>
              </div>
              {isEditing ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="border-[#30363D] text-[#7D8590]"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        full_name: profile.full_name || '',
                        email: profile.email || '',
                        phone: profile.phone || '',
                        location: profile.location || '',
                        avatar: profile.avatar || ''
                      });
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-[#1F6FEB] text-white hover:bg-[#1F6FEB]/90"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Profile'}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="border-[#30363D] text-[#E6EDF3]"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              )}
            </div>

            <Separator className="bg-[#30363D] mb-6" />

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[#C9D1D9] text-sm mb-2 block flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    disabled={!isEditing}
                    className="bg-[#0D1117] border-[#30363D] text-[#E6EDF3] disabled:opacity-75 disabled:cursor-not-allowed"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="text-[#C9D1D9] text-sm mb-2 block flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    className="bg-[#0D1117] border-[#30363D] text-[#E6EDF3] disabled:opacity-75 disabled:cursor-not-allowed"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[#C9D1D9] text-sm mb-2 block flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    className="bg-[#0D1117] border-[#30363D] text-[#E6EDF3] disabled:opacity-75 disabled:cursor-not-allowed"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="text-[#C9D1D9] text-sm mb-2 block flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    disabled={!isEditing}
                    className="bg-[#0D1117] border-[#30363D] text-[#E6EDF3] disabled:opacity-75 disabled:cursor-not-allowed"
                    placeholder="Enter location"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#C9D1D9] text-sm mb-2 block flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Member Since
                </label>
                <Input
                  value={profile.member_since}
                  disabled
                  className="bg-[#0D1117] border-[#30363D] text-[#7D8590] disabled:opacity-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D]">
            <h3 className="text-[#E6EDF3] mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {activityHistory.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 pb-4 border-b border-[#30363D] last:border-0 last:pb-0">
                  <div className={`w-2 h-2 rounded-full mt-2 ${activity.type === 'threat' ? 'bg-[#FF4D4D]' :
                      activity.type === 'config' ? 'bg-[#FFA657]' :
                        activity.type === 'model' ? 'bg-[#58A6FF]' :
                          activity.type === 'report' ? 'bg-[#3FB950]' :
                            'bg-[#7D8590]'
                    }`} />
                  <div className="flex-1">
                    <div className="text-[#E6EDF3]">{activity.action}</div>
                    <div className="text-[#7D8590] text-sm mt-1">{activity.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D]">
            <h3 className="text-[#E6EDF3] mb-6">Achievements</h3>
            <div className="space-y-4">
              {achievements.map((achievement, index) => (
                <div key={index} className="bg-[#0D1117] border border-[#30363D] rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${achievement.color}20` }}>
                      <achievement.icon className="w-5 h-5" style={{ color: achievement.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-[#E6EDF3] mb-1">{achievement.title}</div>
                      <div className="text-[#7D8590] text-sm">{achievement.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D]">
            <h3 className="text-[#E6EDF3] mb-6">Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#30363D]">
                <span className="text-[#7D8590]">Threats Blocked</span>
                <span className="text-[#E6EDF3]">2,847</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-[#30363D]">
                <span className="text-[#7D8590]">Reports Generated</span>
                <span className="text-[#E6EDF3]">142</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-[#30363D]">
                <span className="text-[#7D8590]">Models Trained</span>
                <span className="text-[#E6EDF3]">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#7D8590]">Active Days</span>
                <span className="text-[#E6EDF3]">298</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D]">
            <h3 className="text-[#E6EDF3] mb-4">Project Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#7D8590]">Course</span>
                <span className="text-[#58A6FF]">Computer Science</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#7D8590]">Module</span>
                <span className="text-[#E6EDF3]">Final Year Project</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#7D8590]">Status</span>
                <span className="text-[#E6EDF3]">Prototype</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
        <DialogContent 
          className="bg-[#161B22] border-[#30363D] text-[#E6EDF3]"
          style={{ position: 'fixed', inset: 0, margin: 'auto', width: '90%', maxWidth: '425px', height: 'fit-content', maxHeight: '85vh', overflowY: 'auto', zIndex: 99999, borderRadius: '12px' }}
        >
          <DialogHeader>
            <DialogTitle>Choose Avatar</DialogTitle>
            <DialogDescription className="text-[#7D8590]">
              Select a predefined avatar or upload your own image.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 py-4 justify-items-center" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px', justifyItems: 'center', padding: '16px 0' }}>
            {DEFAULT_AVATARS.map((seed) => (
              <button
                key={seed}
                onClick={() => selectDefaultAvatar(seed)}
                className="relative rounded-full overflow-hidden border-2 border-transparent hover:border-[#1F6FEB] transition-colors group shrink-0"
                style={{ width: '64px', height: '64px', borderRadius: '50%', flexShrink: 0 }}
              >
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} alt={seed} style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#0D1117' }} />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" style={{ position: 'absolute', inset: 0 }} />
              </button>
            ))}
          </div>
          
          <div className="pt-2 pb-4">
            <label className="flex items-center justify-center w-full gap-2 px-4 py-3 border border-dashed border-[#30363D] rounded-xl cursor-pointer hover:bg-[#1E232B] transition-all" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '8px', padding: '12px 16px', border: '1px dashed #30363D', borderRadius: '12px', cursor: 'pointer' }}>
              <Upload className="w-5 h-5 text-[#7D8590]" style={{ width: '20px', height: '20px', color: '#7D8590' }} />
              <span className="text-[#E6EDF3]" style={{ color: '#E6EDF3' }}>Upload custom image</span>
              <input type="file" accept="image/*" style={{ display: 'none', width: 0, height: 0, opacity: 0 }} onChange={handleAvatarChange} />
            </label>
            <p className="text-center text-xs text-[#7D8590] mt-2">Max file size: 2MB</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
