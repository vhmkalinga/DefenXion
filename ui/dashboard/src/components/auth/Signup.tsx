import { useState } from 'react';
import { Shield, Mail, Lock, Eye, EyeOff, User, Building } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';

interface SignupProps {
  onSignup: () => void;
  onSwitchToLogin: () => void;
}

export function Signup({ onSignup, onSwitchToLogin }: SignupProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    organization: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onSignup();
    }, 1500);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1F6FEB]/10 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-[#1F6FEB]" />
          </div>
          <h1 className="text-[#E6EDF3] mb-2">Create Account</h1>
          <p className="text-[#7D8590]">Get started with CyberGuard AI</p>
        </div>

        <div className="bg-[#161B22] rounded-2xl p-8 border border-[#30363D]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-[#C9D1D9]">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8590]" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => updateFormData('fullName', e.target.value)}
                  className="pl-10 bg-[#0D1117] border-[#30363D] text-[#E6EDF3]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization" className="text-[#C9D1D9]">Organization</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8590]" />
                <Input
                  id="organization"
                  type="text"
                  placeholder="Your Company"
                  value={formData.organization}
                  onChange={(e) => updateFormData('organization', e.target.value)}
                  className="pl-10 bg-[#0D1117] border-[#30363D] text-[#E6EDF3]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#C9D1D9]">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8590]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className="pl-10 bg-[#0D1117] border-[#30363D] text-[#E6EDF3]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#C9D1D9]">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8590]" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  className="pl-10 pr-10 bg-[#0D1117] border-[#30363D] text-[#E6EDF3]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D8590] hover:text-[#C9D1D9]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[#C9D1D9]">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8590]" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  className="pl-10 pr-10 bg-[#0D1117] border-[#30363D] text-[#E6EDF3]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D8590] hover:text-[#C9D1D9]"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox id="terms" required />
              <label htmlFor="terms" className="text-sm text-[#C9D1D9] cursor-pointer leading-tight">
                I agree to the{' '}
                <span className="text-[#58A6FF] hover:text-[#1F6FEB]">Terms of Service</span>
                {' '}and{' '}
                <span className="text-[#58A6FF] hover:text-[#1F6FEB]">Privacy Policy</span>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#1F6FEB] hover:bg-[#1F6FEB]/90"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-[#7D8590] text-sm">Already have an account? </span>
            <Button
              type="button"
              variant="link"
              onClick={onSwitchToLogin}
              className="text-[#58A6FF] hover:text-[#1F6FEB] p-0 h-auto text-sm"
            >
              Sign in
            </Button>
          </div>
        </div>

        <p className="text-center text-[#7D8590] text-xs mt-6">
          CyberGuard AI © 2025 — Intelligent Defense System
        </p>
      </div>
    </div>
  );
}
