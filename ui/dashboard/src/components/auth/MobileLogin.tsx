import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';

interface MobileLoginProps {
  onLogin: () => void;
}

export function MobileLogin({ onLogin }: MobileLoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col p-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#1F6FEB] to-[#58A6FF] rounded-3xl mb-6 shadow-lg shadow-[#1F6FEB]/20"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-[#E6EDF3] mb-2">Welcome Back</h1>
          <p className="text-[#7D8590]">Sign in to continue protecting your systems</p>
        </div>

        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit} 
          className="space-y-5"
        >
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7D8590]" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-14 bg-[#161B22] border-[#30363D] text-[#E6EDF3] rounded-2xl"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7D8590]" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 pr-12 h-14 bg-[#161B22] border-[#30363D] text-[#E6EDF3] rounded-2xl"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7D8590] hover:text-[#C9D1D9]"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" />
              <label htmlFor="remember" className="text-sm text-[#C9D1D9] cursor-pointer">
                Remember me
              </label>
            </div>
            <Button
              type="button"
              variant="link"
              onClick={() => alert("Please contact your system administrator to reset your password. \n\n(Option A: Secure Admin Reset Policy)")}
              className="text-[#58A6FF] hover:text-[#1F6FEB] p-0 h-auto text-sm"
            >
              Forgot?
            </Button>
          </div>

          <Button
            type="submit"
            className="w-full h-14 bg-gradient-to-r from-[#1F6FEB] to-[#58A6FF] hover:opacity-90 rounded-2xl gap-2 text-white shadow-lg shadow-[#1F6FEB]/20"
            disabled={isLoading}
          >
            {isLoading ? (
              'Signing in...'
            ) : (
              <>
                Sign In
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </motion.form>

      </motion.div>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-[#7D8590] text-xs mt-6"
      >
        CyberGuard AI © 2025
      </motion.p>
    </div>
  );
}
