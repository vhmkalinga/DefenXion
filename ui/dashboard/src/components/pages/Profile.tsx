import { User, Mail, Phone, MapPin, Calendar, Shield, Award, Activity } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

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
  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <h2 className="text-[#E6EDF3] mb-8">Profile</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1E232B] rounded-2xl p-6 border border-[#30363D]">
            <div className="flex items-start gap-6 mb-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-[#E6EDF3] mb-2">Admin User</h3>
                <p className="text-[#7D8590] mb-4">Security Administrator</p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="border-[#3FB950] text-[#3FB950]">
                    Active
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-[#30363D] text-[#E6EDF3]"
                onClick={() => toast.info('Profile editing is disabled in this prototype.')}
              >
                Edit Profile
              </Button>
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
                    defaultValue="Admin User"
                    className="bg-[#0D1117] border-[#30363D] text-[#E6EDF3]"
                  />
                </div>
                <div>
                  <label className="text-[#C9D1D9] text-sm mb-2 block flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  <Input
                    type="email"
                    defaultValue="admin@cyberguard.ai"
                    className="bg-[#0D1117] border-[#30363D] text-[#E6EDF3]"
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
                    defaultValue="+1 (555) 123-4567"
                    className="bg-[#0D1117] border-[#30363D] text-[#E6EDF3]"
                  />
                </div>
                <div>
                  <label className="text-[#C9D1D9] text-sm mb-2 block flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </label>
                  <Input
                    defaultValue="San Francisco, CA"
                    className="bg-[#0D1117] border-[#30363D] text-[#E6EDF3]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#C9D1D9] text-sm mb-2 block flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Member Since
                </label>
                <Input
                  defaultValue="January 2024"
                  disabled
                  className="bg-[#0D1117] border-[#30363D] text-[#7D8590]"
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
    </div>
  );
}
