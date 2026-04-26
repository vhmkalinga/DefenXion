import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface ThreatNotification {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: Date;
}

const threatTypes = [
  { type: 'DDoS Attack', severity: 'critical' },
  { type: 'SQL Injection', severity: 'high' },
  { type: 'Malware Detection', severity: 'critical' },
  { type: 'Phishing Attempt', severity: 'medium' },
  { type: 'XSS Attack', severity: 'high' },
  { type: 'Brute Force', severity: 'high' },
  { type: 'Port Scan', severity: 'low' },
];

export function ThreatNotificationSystem() {
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/threats');

    ws.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        const toastConfig = {
          duration: 5000,
          className: 'bg-[#161B22] border-[#30363D] text-[#E6EDF3]',
        };

        if (notification.type === 'critical') {
          toast.error(notification.title, {
            description: notification.message,
            ...toastConfig,
            icon: <AlertTriangle className="w-5 h-5 text-[#FF4D4D]" />,
          });
        } else if (notification.type === 'high') {
          toast.warning(notification.title, {
            description: notification.message,
            ...toastConfig,
            icon: <Shield className="w-5 h-5 text-[#FFA657]" />,
          });
        } else {
          toast.info(notification.title || 'Security Notification', {
            description: notification.message,
            ...toastConfig,
            icon: <CheckCircle className="w-5 h-5 text-[#58A6FF]" />,
          });
        }
      } catch (err) {
        console.error('Failed to parse WebSocket threat notification:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, []);

  return null;
}
