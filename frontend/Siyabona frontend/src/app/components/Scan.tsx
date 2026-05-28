import { useState } from 'react';
import { MessageSquare, Link2, Loader2, Copy, AlertCircle, CheckCircle, HelpCircle, Share2, Flag, TrendingUp, AlertTriangle, Shield } from 'lucide-react';
import { apiService, type ScanResult } from '../services/api';

interface ScanProps {
  initialTab?: 'sms' | 'whatsapp' | 'url';
}

export function Scan({ initialTab = 'sms' }: ScanProps) {
  const [activeTab, setActiveTab] = useState<'sms' | 'whatsapp' | 'url'>(initialTab);
  const [inputText, setInputText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const examples = {
    sms: "CAPITEC: Your account has been suspended due to suspicious activity. Click https://capitec-secure-verify.co.za to restore access immediately. Failure to verify within 24 hours will result in permanent account closure.",
    whatsapp: "Hi Mom, it's me. I lost my phone and this is my new number. Please send R2000 urgently for an emergency. I'll explain later. Just send to this account: Capitec 1234567890",
    url: "https://capitecbank-verify-account.xyz/login"
  };

  const handleScan = async () => {
    if (!inputText.trim()) {
      alert('Please enter a message or link to scan');
      return;
    }

    setIsScanning(true);
    setResult(null);

    try {
      let scanResult: ScanResult;

      if (activeTab === 'url') {
        scanResult = await apiService.scanURL(inputText);
      } else if (activeTab === 'whatsapp') {
        scanResult = await apiService.scanWhatsApp(inputText);
      } else {
        scanResult = await apiService.scanSMS(inputText);
      }

      setResult(scanResult);
    } catch (error) {
      console.error('Scan error:', error);
      alert('Failed to scan. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  };

  const handleClear = () => {
    setInputText('');
    setResult(null);
  };

  const handleTryExample = () => {
    setInputText(examples[activeTab]);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'dangerous': return 'text-red-600';
      case 'suspicious': return 'text-orange-600';
      case 'safe': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'dangerous': return 'bg-red-50';
      case 'suspicious': return 'bg-orange-50';
      case 'safe': return 'bg-green-50';
      default: return 'bg-gray-50';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'dangerous': return <AlertCircle className="w-12 h-12 text-red-600" />;
      case 'suspicious': return <AlertTriangle className="w-12 h-12 text-orange-600" />;
      case 'safe': return <CheckCircle className="w-12 h-12 text-green-600" />;
      default: return <HelpCircle className="w-12 h-12 text-gray-600" />;
    }
  };

  const getSignalIcon = (signal: string) => {
    const iconProps = { className: "w-5 h-5 text-orange-600" };
    switch (signal) {
      case 'urgency': return <TrendingUp {...iconProps} />;
      case 'impersonation': return <AlertCircle {...iconProps} />;
      case 'suspicious_url': return <Link2 {...iconProps} />;
      case 'emotional_manipulation': return <AlertTriangle {...iconProps} />;
      default: return <AlertCircle {...iconProps} />;
    }
  };

  const getSignalLabel = (signal: string) => {
    const labels: Record<string, string> = {
      'urgency': 'Urgency Tactics',
      'impersonation': 'Brand Impersonation',
      'suspicious_url': 'Suspicious Link',
      'emotional_manipulation': 'Emotional Manipulation',
      'spoofed_number': 'Spoofed Number'
    };
    return labels[signal] || signal;
  };

  const handleShare = async () => {
    if (result) {
      const text = `SIYABONA Scam Alert\n\nRisk Score: ${result.riskScore}%\n\n${result.explanation}\n\nStay safe! Use SIYABONA to protect yourself from scams.`;

      if (navigator.share) {
        try {
          await navigator.share({ text });
        } catch (err) {
          console.error('Share failed:', err);
        }
      } else {
        await navigator.clipboard.writeText(text);
        alert('Alert copied to clipboard!');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Tab Selector */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 sticky top-0 z-10">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveTab('sms');
              setResult(null);
              setInputText('');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-colors ${
              activeTab === 'sms' ? 'bg-green-100 text-green-700' : 'bg-gray-50 text-gray-600'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm font-medium">SMS</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('whatsapp');
              setResult(null);
              setInputText('');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-colors ${
              activeTab === 'whatsapp' ? 'bg-green-100 text-green-700' : 'bg-gray-50 text-gray-600'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm font-medium">WhatsApp</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('url');
              setResult(null);
              setInputText('');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-colors ${
              activeTab === 'url' ? 'bg-green-100 text-green-700' : 'bg-gray-50 text-gray-600'
            }`}
          >
            <Link2 className="w-5 h-5" />
            <span className="text-sm font-medium">Link</span>
          </button>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-semibold text-gray-800">
              {activeTab === 'sms' && 'Paste SMS Message'}
              {activeTab === 'whatsapp' && 'Paste WhatsApp Message'}
              {activeTab === 'url' && 'Enter URL to Check'}
            </label>
            <button
              onClick={handlePaste}
              className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              <Copy className="w-4 h-4" />
              Paste
            </button>
          </div>

          <textarea
            className="w-full min-h-[150px] p-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder={
              activeTab === 'sms'
                ? "Paste suspicious SMS message here...\n\nExample: 'CAPITEC: Your account has been suspended...'"
                : activeTab === 'whatsapp'
                ? "Paste WhatsApp message...\n\nExample: 'Hi Mom, it's me. New number. Send money urgently...'"
                : "Enter URL to check...\n\nExample: https://capitec-secure-verify.co.za"
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isScanning}
          />

          <div className="flex justify-between items-center mt-3">
            <button
              onClick={handleClear}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              Clear
            </button>
            <button
              onClick={handleTryExample}
              className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1 font-medium"
            >
              <HelpCircle className="w-4 h-4" />
              Try Example
            </button>
          </div>
        </div>

        {/* Scan Button */}
        <button
          onClick={handleScan}
          disabled={isScanning || !inputText.trim()}
          className="w-full mt-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              Analyze Now
            </>
          )}
        </button>

        {/* Results */}
        {result && (
          <div className="mt-6 bg-white rounded-xl shadow-md overflow-hidden">
            {/* Result Header */}
            <div className={`p-6 ${getRiskBgColor(result.riskLevel)}`}>
              <div className="flex items-center gap-4">
                {getRiskIcon(result.riskLevel)}
                <div className="flex-1">
                  <h3 className={`text-xl font-bold ${getRiskColor(result.riskLevel)}`}>
                    {result.riskLevel === 'dangerous' && '⚠️ SCAM DETECTED'}
                    {result.riskLevel === 'suspicious' && '⚠️ SUSPICIOUS'}
                    {result.riskLevel === 'safe' && '✓ LIKELY SAFE'}
                  </h3>
                  <p className="text-lg font-semibold text-gray-700 mt-1">
                    {result.riskScore}% Risk Score
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {result.confidence}% confidence
                  </p>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="p-6 border-t border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-2">Why this was flagged:</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{result.explanation}</p>
            </div>

            {/* Detection Signals */}
            {result.signals.length > 0 && (
              <div className="p-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3">Detection Signals</h4>
                <div className="space-y-2">
                  {result.signals.map((signal, index) => (
                    <div key={index} className="flex items-center gap-3">
                      {getSignalIcon(signal)}
                      <span className="text-sm text-gray-700">{getSignalLabel(signal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Domain Analysis */}
            {result.domainAnalysis && (
              <div className="p-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">Domain Analysis</h4>
                <p className="text-sm text-gray-700 mb-2">Domain: {result.domainAnalysis.domain}</p>
                {result.domainAnalysis.isSuspiciousTld && (
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Suspicious top-level domain detected
                  </p>
                )}
                {result.domainAnalysis.isIpAddress && (
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    IP address URL - very suspicious
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleShare}
                className="flex-1 py-3 border-2 border-green-600 text-green-600 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-50 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share Alert
              </button>
              {result.riskLevel !== 'safe' && (
                <button
                  onClick={() => alert('Thank you for reporting. This helps protect others!')}
                  className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
                >
                  <Flag className="w-4 h-4" />
                  Report Scam
                </button>
              )}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800 leading-relaxed">
            We never store your personal messages. All scans are private and encrypted.
            Results are anonymized to help improve detection for everyone.
          </p>
        </div>
      </div>
    </div>
  );
}
