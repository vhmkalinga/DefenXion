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
    let ws: WebSocket | null = null;
    
    // Small delay to prevent React 18 StrictMode from creating and immediately 
    // closing the WebSocket during its double-mount cycle.
    const timeoutId = setTimeout(() => {
      ws = new WebSocket('ws://127.0.0.1:8000/ws/threats');

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
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    };
  }, []);

  return null;
}
