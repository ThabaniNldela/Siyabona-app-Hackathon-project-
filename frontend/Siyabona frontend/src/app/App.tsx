import { useState } from 'react';
import { Home as HomeIcon, Search, History, Flag, User, Shield } from 'lucide-react';
import { Home } from './components/Home';
import { Scan } from './components/Scan';

type View = 'home' | 'scan' | 'history' | 'report' | 'profile';
type ScanType = 'sms' | 'whatsapp' | 'url';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [scanType, setScanType] = useState<ScanType>('sms');

  const handleNavigate = (view: View) => {
    setCurrentView(view);
  };

  const handleScanType = (type: ScanType) => {
    setScanType(type);
  };

  return (
    <div className="size-full bg-gray-50 flex flex-col">
      {/* App Header */}
      <header className="bg-green-600 text-white px-6 py-4 shadow-md">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8" />
          <div>
            <h1 className="text-xl font-bold">SIYABONA</h1>
            <p className="text-xs opacity-90">Mobile IPS</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {currentView === 'home' && (
          <Home onNavigate={handleNavigate} onScanType={handleScanType} />
        )}
        {currentView === 'scan' && <Scan initialTab={scanType} />}
        {currentView === 'history' && <HistoryView />}
        {currentView === 'report' && <ReportView />}
        {currentView === 'profile' && <ProfileView />}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 px-4 py-2 shadow-lg">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button
            onClick={() => handleNavigate('home')}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
              currentView === 'home' ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={() => handleNavigate('scan')}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
              currentView === 'scan' ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <Search className="w-6 h-6" />
            <span className="text-xs font-medium">Scan</span>
          </button>
          <button
            onClick={() => handleNavigate('history')}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
              currentView === 'history' ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <History className="w-6 h-6" />
            <span className="text-xs font-medium">History</span>
          </button>
          <button
            onClick={() => handleNavigate('report')}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
              currentView === 'report' ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <Flag className="w-6 h-6" />
            <span className="text-xs font-medium">Report</span>
          </button>
          <button
            onClick={() => handleNavigate('profile')}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
              currentView === 'profile' ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function HistoryView() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Scan History</h2>
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No scan history yet</p>
          <p className="text-sm text-gray-500 mt-2">Your previous scans will appear here</p>
        </div>
      </div>
    </div>
  );
}

function ReportView() {
  const [reportText, setReportText] = useState('');
  const [reportType, setReportType] = useState('sms');

  const handleSubmit = () => {
    if (!reportText.trim()) {
      alert('Please enter details about the scam');
      return;
    }
    alert('Thank you for reporting! This helps protect the community.');
    setReportText('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Report a Scam</h2>
        <p className="text-sm text-gray-600 mb-6">
          Help protect others by reporting scams you've encountered
        </p>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Type of Scam
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="sms">SMS Scam</option>
            <option value="whatsapp">WhatsApp Scam</option>
            <option value="call">Phone Call Scam</option>
            <option value="email">Email Scam</option>
            <option value="other">Other</option>
          </select>

          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Details
          </label>
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            className="w-full min-h-[200px] p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Describe the scam, including:\n- What happened\n- Phone number or sender\n- Any suspicious links\n- How you were contacted"
          />

          <button
            onClick={handleSubmit}
            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Flag className="w-5 h-5" />
            Submit Report
          </button>
        </div>

        <div className="mt-6 bg-blue-50 rounded-xl p-4">
          <p className="text-xs text-blue-800">
            Your report will be reviewed and added to our scam database to help protect others.
            All reports are kept confidential.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProfileView() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile & Settings</h2>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          <div className="p-6 bg-gradient-to-br from-green-600 to-green-700 text-white">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-center">Protected User</h3>
            <p className="text-sm text-center opacity-90 mt-1">Free Plan</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm divide-y">
          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <span className="font-medium text-gray-800">Notifications</span>
            <span className="text-sm text-gray-600">On</span>
          </button>
          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <span className="font-medium text-gray-800">Privacy Settings</span>
            <span className="text-sm text-gray-600">→</span>
          </button>
          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <span className="font-medium text-gray-800">About SIYABONA</span>
            <span className="text-sm text-gray-600">→</span>
          </button>
          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <span className="font-medium text-gray-800">Help & Support</span>
            <span className="text-sm text-gray-600">→</span>
          </button>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-2">About</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            SIYABONA (meaning "We see you" in Zulu) is an AI-powered scam detection system
            designed to protect South Africans from SMS, WhatsApp, and online fraud.
          </p>
          <p className="text-xs text-gray-500 mt-4">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}