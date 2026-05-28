import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Activity, Search, MessageSquare, Link2, Info, TrendingUp } from 'lucide-react';
import { apiService, type UserStats } from '../services/api';

interface HomeProps {
  onNavigate: (view: 'home' | 'scan') => void;
  onScanType: (type: 'sms' | 'whatsapp' | 'url') => void;
}

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  date: string;
}

export function Home({ onNavigate, onScanType }: HomeProps) {
  const [stats, setStats] = useState<UserStats>({
    totalScans: 0,
    dangerousCount: 0,
    suspiciousCount: 0,
    avgRiskScore: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const recentAlerts: Alert[] = [
    {
      id: '1',
      title: 'Fake SARS Refund SMS Spreading',
      description: 'New SMS scam pretending to be SARS asking for tax refund verification. Do not click any links.',
      severity: 'high',
      date: 'Today',
    },
    {
      id: '2',
      title: 'WhatsApp Deepfake Voice Scam',
      description: 'Scammers using AI voice cloning to impersonate family members asking for urgent money.',
      severity: 'high',
      date: 'Yesterday',
    },
    {
      id: '3',
      title: 'Capitec OTP Fraud Campaign',
      description: 'Fake Capitec SMS claiming account suspended with fraudulent number.',
      severity: 'medium',
      date: '2 days ago',
    },
  ];

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const userStats = await apiService.getUserStats();
      setStats(userStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { text: 'High Risk', color: 'text-red-600' };
    if (score >= 40) return { text: 'Medium Risk', color: 'text-orange-600' };
    return { text: 'Low Risk', color: 'text-green-600' };
  };

  const riskLevel = getRiskLevel(stats.avgRiskScore);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 text-white px-6 py-8">
        <h1 className="text-sm opacity-90">Welcome back,</h1>
        <h2 className="text-3xl font-bold mt-1">Stay Protected</h2>
        <p className="text-sm mt-2 opacity-80">Seeing through the deception</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 px-4 -mt-6">
        <div className="bg-white rounded-xl shadow-md p-4 text-center">
          <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">{stats.totalScans}</div>
          <div className="text-xs text-gray-600 mt-1">Total Scans</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-red-600">{stats.dangerousCount}</div>
          <div className="text-xs text-gray-600 mt-1">Scams Blocked</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 text-center">
          <Activity className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <div className={`text-lg font-bold ${riskLevel.color}`}>{riskLevel.text}</div>
          <div className="text-xs text-gray-600 mt-1">Avg Risk</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-6">
        <h3 className="font-bold text-gray-800 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => {
              onScanType('sms');
              onNavigate('scan');
            }}
            className="bg-green-600 hover:bg-green-700 text-white rounded-xl p-4 flex flex-col items-center gap-2 transition-colors"
          >
            <MessageSquare className="w-7 h-7" />
            <span className="text-xs font-semibold">Scan SMS</span>
          </button>
          <button
            onClick={() => {
              onScanType('whatsapp');
              onNavigate('scan');
            }}
            className="bg-[#25D366] hover:bg-[#1fb855] text-white rounded-xl p-4 flex flex-col items-center gap-2 transition-colors"
          >
            <MessageSquare className="w-7 h-7" />
            <span className="text-xs font-semibold">Scan WhatsApp</span>
          </button>
          <button
            onClick={() => {
              onScanType('url');
              onNavigate('scan');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 flex flex-col items-center gap-2 transition-colors"
          >
            <Link2 className="w-7 h-7" />
            <span className="text-xs font-semibold">Check Link</span>
          </button>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="px-4 mt-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-800">Recent Scam Alerts</h3>
          <button className="text-sm text-green-600 hover:text-green-700 font-medium">
            See All
          </button>
        </div>
        <div className="space-y-3">
          {recentAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white rounded-xl shadow-sm p-4 flex gap-3 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className={`w-2.5 h-2.5 rounded-full ${getSeverityColor(alert.severity)} mt-1.5 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800 text-sm">{alert.title}</h4>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{alert.description}</p>
                <p className="text-xs text-gray-400 mt-1">{alert.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Tips */}
      <div className="px-4 mt-6 mb-6">
        <h3 className="font-bold text-gray-800 mb-3">Safety Tips</h3>
        <div className="space-y-3">
          <div className="bg-white rounded-xl shadow-sm p-4 flex gap-3">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              Banks will NEVER ask for your PIN, OTP, or password via SMS or phone call.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 flex gap-3">
            <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              Always verify urgent requests by calling back on a known, trusted number.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              Never click links in unsolicited messages, even if they look legitimate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
