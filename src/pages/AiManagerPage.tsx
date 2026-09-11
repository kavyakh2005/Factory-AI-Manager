import React, { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import {
  Sparkles,
  Send,
  HelpCircle,
  Database,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ShoppingBag,
  Factory,
  Layers,
  IndianRupee,
  Truck,
  CheckCircle2,
  Code2,
  ShieldCheck,
  Cpu,
  Key,
  FileText,
  Scissors,
  CheckCircle,
  RefreshCw,
  Printer,
  ChevronRight,
  Calculator,
  Sliders,
  AlertOctagon,
  Wrench,
} from 'lucide-react';
import {
  AiService,
  AiChatMessage,
  ExecutiveBriefing,
  FabricEstimationResult,
  QualityAnalysisResult,
} from '../services/ai/aiService';
import { ProductService } from '../services/products/productService';
import { Product, Set as GarmentSet } from '../types';
import { useNavigate } from 'react-router-dom';

export const AiManagerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'ASSISTANT' | 'BRIEFING' | 'FABRIC_ESTIMATOR' | 'QC_ANALYZER' | 'CONTEXT_INSPECTOR'
  >('ASSISTANT');

  // Chat State
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'AI',
      text: 'Namaste! Main Shree Raas Krishnam Creation ka AI Factory Query Assistant hoon. Main factory ke live database (Orders, Production, Inventory, Payments, Suppliers) se real data fetch karke exact factual answers deta hoon.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasCustomKey, setHasCustomKey] = useState(false);

  // Executive Briefing State
  const [briefing, setBriefing] = useState<ExecutiveBriefing | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);

  // Fabric Estimator State
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('Kurti Pant Coord Set');
  const [fabricType, setFabricType] = useState<string>('Cotton Viscose Rayon (140 GSM)');
  const [fabricRate, setFabricRate] = useState<number>(135);
  const [sizeMatrix, setSizeMatrix] = useState<Record<string, number>>({
    '38': 50,
    '40': 50,
    '42': 50,
    '44': 30,
    '46': 20,
    '48': 0,
    '50': 0,
    '52': 0,
  });
  const [estimationResult, setEstimationResult] = useState<FabricEstimationResult | null>(null);

  // Quality Analysis State
  const [qcAnalysis, setQcAnalysis] = useState<QualityAnalysisResult | null>(null);
  const [loadingQc, setLoadingQc] = useState(false);

  // Live Database Context State
  const [liveContextText, setLiveContextText] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    setHasCustomKey(AiService.hasApiKey());
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [prods, context] = await Promise.all([
        ProductService.getProducts(),
        AiService.compileLiveDatabaseContext(),
      ]);
      setProducts(prods);
      setLiveContextText(context);
    } catch (err) {
      console.warn('Initial AI manager load error:', err);
    }
  };

  const handleSaveApiKey = () => {
    AiService.setCustomApiKey(apiKeyInput);
    setHasCustomKey(AiService.hasApiKey());
    setShowApiKeyModal(false);
  };

  const handleQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: AiChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'USER',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const history = messages.slice(-4).map((m) => ({
        role: m.sender === 'USER' ? ('user' as const) : ('model' as const),
        text: m.text,
      }));

      const response = await AiService.generateAiResponse(queryText, history);

      const aiMsg: AiChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'AI',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dataCard: response.dataCard,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI Query Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBriefing = async () => {
    setLoadingBriefing(true);
    try {
      const res = await AiService.generateExecutiveBriefing();
      setBriefing(res);
    } catch (err) {
      console.error('Error generating briefing:', err);
    } finally {
      setLoadingBriefing(false);
    }
  };

  const handleCalculateFabric = async () => {
    try {
      const res = await AiService.estimateFabricRequirement({
        productName: selectedProduct,
        fabricType,
        costPerMeter: fabricRate,
        sizeQuantities: sizeMatrix,
      });
      setEstimationResult(res);
    } catch (err) {
      console.error('Error calculating fabric:', err);
    }
  };

  const handleLoadQcAnalysis = async () => {
    setLoadingQc(true);
    try {
      const res = await AiService.analyzeQualityDefects();
      setQcAnalysis(res);
    } catch (err) {
      console.error('Error loading QC analysis:', err);
    } finally {
      setLoadingQc(false);
    }
  };

  const suggestedQueries = [
    'Kaunsa order delay ho raha hai?',
    'Kaunsa fabric low stock hai?',
    'Is month kitni production hui?',
    'Current production bottleneck kya hai?',
    'Kitna customer outstanding uncollected hai?',
    'Kaunsa vendor payment pending hai?',
    'Daily production target status kya hai?',
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              AI Factory Intelligence Engine
              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                Gemini RAG
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Production reasoning, sizing analytics, QC defect diagnosis & executive briefing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowApiKeyModal(true)}
            className="flex items-center gap-1.5 text-xs"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            {hasCustomKey ? 'Gemini Key Configured' : 'Configure Gemini API Key'}
          </Button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Live Database Connected
          </span>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-800 gap-1 pb-1">
        <button
          onClick={() => setActiveTab('ASSISTANT')}
          className={`py-2.5 px-4 text-sm font-semibold rounded-lg flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'ASSISTANT'
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Live Factory Query Shell
        </button>

        <button
          onClick={() => {
            setActiveTab('BRIEFING');
            if (!briefing) handleGenerateBriefing();
          }}
          className={`py-2.5 px-4 text-sm font-semibold rounded-lg flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'BRIEFING'
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          AI Executive Daily Briefing
        </button>

        <button
          onClick={() => {
            setActiveTab('FABRIC_ESTIMATOR');
            if (!estimationResult) handleCalculateFabric();
          }}
          className={`py-2.5 px-4 text-sm font-semibold rounded-lg flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'FABRIC_ESTIMATOR'
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Calculator className="w-4 h-4" />
          Fabric & Sizing Estimator
        </button>

        <button
          onClick={() => {
            setActiveTab('QC_ANALYZER');
            if (!qcAnalysis) handleLoadQcAnalysis();
          }}
          className={`py-2.5 px-4 text-sm font-semibold rounded-lg flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'QC_ANALYZER'
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          QC Defect Root-Cause Analyzer
        </button>

        <button
          onClick={() => setActiveTab('CONTEXT_INSPECTOR')}
          className={`py-2.5 px-4 text-sm font-semibold rounded-lg flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'CONTEXT_INSPECTOR'
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Database className="w-4 h-4" />
          RAG Database Snapshot
        </button>
      </div>

      {/* TAB 1: LIVE QUERY SHELL */}
      {activeTab === 'ASSISTANT' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 min-h-[460px] max-h-[540px] overflow-y-auto space-y-4 shadow-inner">
            {messages.map((m) => {
              const isUser = m.sender === 'USER';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[11px] font-semibold text-slate-400">
                      {isUser ? 'Factory Operator / Owner' : 'AI Factory Reasoning Engine'}
                    </span>
                    <span className="text-[10px] text-slate-500">{m.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none shadow-md'
                        : 'bg-slate-800/95 text-slate-200 border border-slate-700/80 rounded-tl-none shadow'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>

                    {m.dataCard && (
                      <div className="mt-3.5 pt-3 border-t border-slate-700/80 space-y-2">
                        <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-indigo-400" /> {m.dataCard.title}
                        </p>
                        <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-750">
                          {m.dataCard.metrics.map((met, idx) => (
                            <div key={idx} className="flex justify-between text-xs py-0.5">
                              <span className="text-slate-400">{met.label}:</span>
                              <span className={`font-semibold ${met.color || 'text-white'}`}>
                                {met.value}
                              </span>
                            </div>
                          ))}
                        </div>

                        {m.dataCard.linkUrl && (
                          <button
                            onClick={() => navigate(m.dataCard!.linkUrl!)}
                            className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition"
                          >
                            View Live Module <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2.5 text-xs text-indigo-400 py-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping"></span>
                Querying PostgreSQL state & generating RAG response...
              </div>
            )}
          </div>

          {/* Quick Prompt Pills */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" /> Quick Factory Prompts:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQueries.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuery(prompt)}
                  className="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700/80 transition shadow-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Query Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleQuery(inputQuery);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask in English or Hindi (e.g. 'Delayed orders kaunse hain?', 'How much fabric is in low stock?')..."
              className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
            <Button
              variant="primary"
              type="submit"
              className="px-6 flex items-center gap-2 font-semibold"
              disabled={!inputQuery.trim() || loading}
            >
              <Send className="w-4 h-4" />
              Ask AI
            </Button>
          </form>
        </div>
      )}

      {/* TAB 2: AI EXECUTIVE DAILY BRIEFING */}
      {activeTab === 'BRIEFING' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" /> Daily Factory Intelligence Brief
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated executive summary synthesized from orders, production stages, stock, and ledger
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-1 text-xs"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Export
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateBriefing}
                disabled={loadingBriefing}
                className="flex items-center gap-1 text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingBriefing ? 'animate-spin' : ''}`} />
                Regenerate Briefing
              </Button>
            </div>
          </div>

          {loadingBriefing ? (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
              <p className="text-sm font-medium">Synthesizing Factory Health Metrics...</p>
            </div>
          ) : briefing ? (
            <div className="space-y-5">
              {/* Health Score & Headline */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Factory Health Score
                  </span>
                  <div className="text-4xl font-extrabold text-indigo-400 mt-2">
                    {briefing.factoryHealthScore}
                    <span className="text-lg text-slate-500">/100</span>
                  </div>
                  <span
                    className={`mt-2 text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      briefing.factoryHealthScore >= 80
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {briefing.factoryHealthScore >= 80 ? 'Optimal Performance' : 'Attention Required'}
                  </span>
                </div>

                <div className="md:col-span-3 bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-center">
                  <h3 className="text-lg font-bold text-white">{briefing.headline}</h3>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                    {briefing.executiveSummary}
                  </p>
                </div>
              </div>

              {/* Key Top Priorities */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Top Priority Action Items
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {briefing.topPriorities.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              item.urgency === 'CRITICAL'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : item.urgency === 'HIGH'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}
                          >
                            {item.urgency}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-2">{item.title}</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(item.actionLink)}
                        className="mt-3 text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                      >
                        Take Action <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Operational Metrics Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-400">Active Floor Orders</span>
                  <p className="text-xl font-bold text-white mt-1">
                    {briefing.operationalMetrics.activeOrdersCount} ({briefing.operationalMetrics.totalOrderPieces.toLocaleString('en-IN')} pcs)
                  </p>
                </div>
                <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-400">Delayed Client Orders</span>
                  <p className="text-xl font-bold text-red-400 mt-1">
                    {briefing.operationalMetrics.delayedOrdersCount}
                  </p>
                </div>
                <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-400">QC Defect Rejection Rate</span>
                  <p className="text-xl font-bold text-amber-400 mt-1">
                    {briefing.operationalMetrics.qcRejectionRatePercent}%
                  </p>
                </div>
                <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-400">Market Receivables Due</span>
                  <p className="text-xl font-bold text-emerald-400 mt-1">
                    ₹{briefing.operationalMetrics.uncollectedReceivables.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* AI Bottleneck Diagnosis */}
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-start gap-3">
                <Wrench className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-indigo-200">AI Bottleneck Diagnosis</h4>
                  <p className="text-xs text-indigo-300/90 mt-1 leading-relaxed">
                    {briefing.aiBottleneckDiagnosis}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 3: AI FABRIC & SIZING ESTIMATOR */}
      {activeTab === 'FABRIC_ESTIMATOR' && (
        <div className="space-y-5">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-400" /> AI Fabric Consumption & Lay Plan Estimator
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Calculates exact meter requirements per Set size breakdown including 5% cutting wastage buffer
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Input Config */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" /> Batch Parameters
              </h3>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Product Style
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Kurti Pant Coord Set">Kurti Pant Coord Set</option>
                  <option value="Festive Anarkali 3-Piece Set">Festive Anarkali 3-Piece Set</option>
                  <option value="Straight Kurta with Dupatta">Straight Kurta with Dupatta</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Fabric Type</label>
                <input
                  type="text"
                  value={fabricType}
                  onChange={(e) => setFabricType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Fabric Rate (₹ / Meter)
                </label>
                <input
                  type="number"
                  value={fabricRate}
                  onChange={(e) => setFabricRate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-2">
                  Size-Wise Batch Quantities (pcs)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(sizeMatrix).map(([sz, qty]) => (
                    <div key={sz} className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 block text-center">
                        {sz}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={qty}
                        onChange={(e) =>
                          setSizeMatrix((prev) => ({
                            ...prev,
                            [sz]: Math.max(0, parseInt(e.target.value) || 0),
                          }))
                        }
                        className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-center text-xs font-bold text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="primary"
                onClick={handleCalculateFabric}
                className="w-full flex items-center justify-center gap-2 font-semibold"
              >
                <Calculator className="w-4 h-4" /> Calculate Fabric & Lay Plan
              </Button>
            </div>

            {/* Estimation Output */}
            <div className="lg:col-span-2 space-y-4">
              {estimationResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                      <span className="text-xs text-slate-400">Total Batch Pieces</span>
                      <p className="text-2xl font-bold text-white mt-1">
                        {estimationResult.totalPieces} pcs
                      </p>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                      <span className="text-xs text-slate-400">Total Fabric Required</span>
                      <p className="text-2xl font-bold text-indigo-400 mt-1">
                        {estimationResult.estimatedFabricMeters} m
                      </p>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                      <span className="text-xs text-slate-400">Avg Meter / Piece</span>
                      <p className="text-2xl font-bold text-emerald-400 mt-1">
                        {estimationResult.metersPerPiece} m
                      </p>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                      <span className="text-xs text-slate-400">Est. Fabric Cost</span>
                      <p className="text-2xl font-bold text-amber-400 mt-1">
                        ₹{Math.round(estimationResult.estimatedCost).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Size Breakdown Table */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Size-Wise Fabric Breakdown (Including 5% Buffer)
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-800 text-slate-400 font-semibold">
                          <tr>
                            <th className="p-2.5 rounded-l">Size</th>
                            <th className="p-2.5">Pieces</th>
                            <th className="p-2.5">Consumption / Pc</th>
                            <th className="p-2.5 rounded-r">Total Meters</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-200">
                          {estimationResult.sizeBreakdown.map((sb, idx) => (
                            <tr key={idx}>
                              <td className="p-2.5 font-bold text-white">{sb.size}</td>
                              <td className="p-2.5">{sb.quantity} pcs</td>
                              <td className="p-2.5">
                                {sb.quantity > 0 ? (sb.fabricMeters / sb.quantity).toFixed(2) : '0.00'} m
                              </td>
                              <td className="p-2.5 font-bold text-indigo-400">{sb.fabricMeters} m</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Lay Plan Recommendation */}
                  <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-indigo-200">
                        Recommended Cutting Table Lay Batches
                      </h4>
                      <p className="text-xs text-indigo-300/80 mt-0.5">
                        Split into {estimationResult.recommendedCuttingBatches} lay batches for optimal pattern utilization.
                      </p>
                    </div>
                    <span className="text-sm font-bold bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-500/30">
                      Est. Production: {estimationResult.estimatedProductionDays} Days
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: QC DEFECT ROOT-CAUSE ANALYZER */}
      {activeTab === 'QC_ANALYZER' && (
        <div className="space-y-5">
          <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-red-400" /> AI Quality Defect & Root-Cause Diagnosis
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates rejection defect logs from Stitching, Cutting, Finishing & QC inspection
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLoadQcAnalysis}
              disabled={loadingQc}
              className="flex items-center gap-1.5 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingQc ? 'animate-spin' : ''}`} /> Re-Analyze
            </Button>
          </div>

          {qcAnalysis && (
            <div className="space-y-5">
              {/* Top Defect Reasons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Top Defect Categories
                  </h3>
                  <div className="space-y-2.5">
                    {qcAnalysis.topDefectReasons.map((dr, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-300">{dr.reason}</span>
                          <span className="text-red-400">
                            {dr.count} pcs ({dr.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-red-500 h-full rounded-full"
                            style={{ width: `${dr.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Stage-Wise Defect Concentration
                  </h3>
                  <div className="space-y-2.5">
                    {qcAnalysis.stageWiseDefectDistribution.map((stg, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-800/60 rounded-lg border border-slate-750 text-xs">
                        <span className="font-semibold text-white">{stg.stageName}</span>
                        <span className="font-bold text-amber-400">{stg.defectCount} rejections</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Root Cause Insights & Corrective Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" /> AI Root-Cause Diagnostic Insights
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside leading-relaxed">
                    {qcAnalysis.rootCauseInsights.map((rc, idx) => (
                      <li key={idx} className="text-slate-300">{rc}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Recommended Corrective Action Plan
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside leading-relaxed">
                    {qcAnalysis.correctiveActionPlan.map((ap, idx) => (
                      <li key={idx} className="text-slate-300">{ap}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: LIVE DATABASE CONTEXT SNAPSHOT */}
      {activeTab === 'CONTEXT_INSPECTOR' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" /> RAG Ground Truth Snapshot (Provided to Gemini LLM)
              </h3>
              <Button variant="secondary" size="sm" onClick={loadInitialData} className="text-xs">
                Refresh Snapshot
              </Button>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              This live text snapshot is automatically compiled from Supabase PostgreSQL tables and passed to Google Gemini to eliminate AI hallucinations.
            </p>
            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap max-h-[460px]">
              {liveContextText}
            </pre>
          </div>
        </div>
      )}

      {/* GEMINI API KEY CONFIG MODAL */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Key className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Google Gemini API Key</h3>
                <p className="text-xs text-slate-400">Configure for direct Gemini 1.5 Flash reasoning</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              If a Gemini API key is configured, the system uses Google Gemini with live PostgreSQL RAG context. If not configured, the system automatically uses our built-in deterministic factory RAG engine.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Gemini API Key (AI Studio)
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowApiKeyModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveApiKey}>
                Save Key
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
