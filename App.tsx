import React, { useState, useEffect } from 'react';
import { parseOrdersWithGemini } from './services/geminiService';
import { ParsingResult, OrderRow, HistoryItem, ChangeLogEntry } from './types';
import { StatsPanel } from './components/StatsPanel';
import { OrderTable } from './components/OrderTable';
import { AuOrderTable } from './components/AuOrderTable';
import { BhamOrderTable } from './components/BhamOrderTable';
import { HistoryList } from './components/HistoryList';
import { ChangeLogPanel } from './components/ChangeLogPanel';

type ViewState = 'home' | 'historyList' | 'historyDetail' | 'auTable' | 'bhamTable';

export default function App() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ParsingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>('home');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [previousView, setPreviousView] = useState<ViewState>('home'); // Track where we came from for "Back" button
  const [selectedBhamIds, setSelectedBhamIds] = useState<string[]>([]);

  // Load history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('orderParserHistory');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  const saveToHistory = (newResult: ParsingResult) => {
    const newId = crypto.randomUUID();
    const newItem: HistoryItem = {
      id: newId,
      timestamp: Date.now(),
      result: newResult
    };
    
    const newHistory = [newItem, ...history];
    setHistory(newHistory);
    localStorage.setItem('orderParserHistory', JSON.stringify(newHistory));
    return newId;
  };

  const updateHistoryItem = (historyId: string, updatedResult: ParsingResult) => {
    const updatedHistory = history.map(item => {
      if (item.id === historyId) {
        return { ...item, result: updatedResult };
      }
      return item;
    });
    setHistory(updatedHistory);
    localStorage.setItem('orderParserHistory', JSON.stringify(updatedHistory));
  };

  const handleProcess = async () => {
    if (!inputText.trim()) {
      setError("Please enter some order text.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setCurrentHistoryId(null);
    setView('home'); // Ensure we remain on home view

    try {
      const data = await parseOrdersWithGemini(inputText);
      setResult(data);
      const newId = saveToHistory(data);
      setCurrentHistoryId(newId);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setResult(item.result);
    setCurrentHistoryId(item.id);
    setView('historyDetail'); // Switch to specific history detail view
    setInputText(""); 
    setError(null);
  };

  const handleUpdateOrder = (id: string, field: keyof OrderRow, value: any) => {
    if (!result) return;

    // 1. Find the order and old value
    const orderToUpdate = result.orders.find(o => o.id === id);
    if (!orderToUpdate) return;
    
    const oldValue = String(orderToUpdate[field] || "");
    const newValue = String(value);

    // If no change, do nothing
    if (oldValue === newValue) return;

    // 2. Create Change Log Entry
    const logEntry: ChangeLogEntry = {
      timestamp: Date.now(),
      customerOrderNo: orderToUpdate.customerOrderNo,
      field: String(field),
      oldValue,
      newValue
    };

    // 3. Update Order Data
    const updatedOrders = result.orders.map(order => {
      if (order.id === id) {
        return { ...order, [field]: value };
      }
      return order;
    });

    const updatedResult: ParsingResult = {
      ...result,
      orders: updatedOrders,
      changeLog: [logEntry, ...(result.changeLog || [])]
    };

    // 4. Update State
    setResult(updatedResult);

    // 5. Update History Persistence
    if (currentHistoryId) {
      updateHistoryItem(currentHistoryId, updatedResult);
    }
  };

  const handleViewAuOrders = () => {
    setPreviousView(view); // Remember if we were in 'home' or 'historyDetail'
    setView('auTable');
  };

  const handleViewBhamOrders = (ids: string[]) => {
    setSelectedBhamIds(ids);
    setPreviousView(view);
    setView('bhamTable');
  };

  const handleBackFromSubView = () => {
    setView(previousView === 'historyDetail' ? 'historyDetail' : 'home');
  };

  const getPageTitle = () => {
    if (view === 'historyDetail') return 'Archived Record';
    if (view === 'historyList') return 'History Records';
    if (view === 'auTable') return 'Australian Orders Filter';
    if (view === 'bhamTable') return 'Birmingham Orders Filter';
    return 'New Processing';
  };

  // Filter for AU orders
  const auOrders = result ? result.orders.filter(o => 
    (o.warehouse && (o.warehouse.includes("澳大利亚") || o.warehouse.toLowerCase().includes("australia"))) ||
    (o.state && ["VIC", "NSW", "QLD", "WA", "SA", "TAS", "ACT", "NT"].includes(o.state.toUpperCase()))
  ) : [];

  // Filter for Bham orders
  const bhamOrders = result ? result.orders.filter(o => selectedBhamIds.includes(o.id)) : [];

  return (
    <div className={`min-h-screen p-6 md:p-12 transition-colors duration-500 ${view === 'historyDetail' || view === 'auTable' || view === 'bhamTable' ? 'bg-amber-50/40' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Main Header */}
        <header className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                OrderParser <span className="text-indigo-600">Pro</span>
              </h1>
              {view === 'historyDetail' && (
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide border border-amber-200">
                  Archive Mode
                </span>
              )}
               {view === 'auTable' && (
                <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide border border-indigo-200">
                  AU Filter Mode
                </span>
              )}
              {view === 'bhamTable' && (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide border border-emerald-200">
                  Bham Filter Mode
                </span>
              )}
            </div>
            <p className="mt-2 text-slate-500">
              {getPageTitle()}
            </p>
          </div>
          
          <div className="flex gap-3">
            {view === 'historyDetail' || view === 'auTable' || view === 'bhamTable' ? (
                // Logic for back button depends on where we are
                (view === 'auTable' || view === 'bhamTable') ? null : ( 
                   <button
                   onClick={() => setView('historyList')}
                   className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 shadow-sm transition-colors flex items-center gap-2"
                 >
                   <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                   Back to List
                 </button>
                )
            ) : view === 'historyList' ? (
              <button
                onClick={() => setView('home')}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 shadow-sm transition-colors flex items-center gap-2"
              >
                 <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                 Back to Parser
              </button>
            ) : (
              <button
                onClick={() => setView('historyList')}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 shadow-sm transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                View History
              </button>
            )}
          </div>
        </header>

        {/* View Content */}
        {view === 'historyList' && (
          <HistoryList 
            history={history} 
            onSelect={handleSelectHistory} 
            onBack={() => setView('home')} 
          />
        )}

        {/* AU Table View */}
        {view === 'auTable' && result && (
            <AuOrderTable 
                orders={auOrders} 
                onUpdateOrder={handleUpdateOrder} 
                onBack={handleBackFromSubView} 
            />
        )}

         {/* Birmingham Table View */}
         {view === 'bhamTable' && result && (
            <BhamOrderTable 
                orders={bhamOrders} 
                onUpdateOrder={handleUpdateOrder} 
                onBack={handleBackFromSubView} 
            />
        )}

        {/* Detail/Edit View (Shared for Home Result and History Detail) */}
        {(view === 'historyDetail' || view === 'home') && result && (
          <div className="animate-fade-in space-y-6">
            {view === 'historyDetail' && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg flex justify-between items-start shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-700">
                      <span className="font-bold">Archived View:</span> You are viewing a saved parsing record.
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      Edits made here are automatically saved to the history log.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {view === 'home' && (
                <div className="mb-4 flex justify-between items-center">
                    <button 
                        onClick={() => { setResult(null); setInputText(''); setCurrentHistoryId(null); }}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Process New Orders
                    </button>
                    {currentHistoryId && (
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                        Auto-saving to History
                        </span>
                    )}
                </div>
            )}

            <StatsPanel stats={result.stats} />
            <OrderTable 
                orders={result.orders} 
                onUpdateOrder={handleUpdateOrder} 
                onViewAuOrders={handleViewAuOrders}
                onViewBhamOrders={handleViewBhamOrders}
            />
            <ChangeLogPanel logs={result.changeLog} />
          </div>
        )}

        {view === 'home' && !result && (
          <div className="space-y-8 animate-fade-in">
             {/* Input Section - Only show if no result is displayed */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <label htmlFor="orderInput" className="block text-sm font-medium text-slate-700 mb-2">
                  Paste Raw Order Text
                </label>
                <textarea
                  id="orderInput"
                  className="w-full h-64 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm resize-y"
                  placeholder="Paste your messy order text here (e.g. 订单号：P7862...)"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                
                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={handleProcess}
                    disabled={isLoading || !inputText}
                    className={`px-6 py-3 rounded-lg text-white font-semibold shadow-sm transition-all
                      ${isLoading || !inputText 
                        ? 'bg-slate-400 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'
                      } flex items-center gap-2`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing Orders...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        Convert to Table
                      </>
                    )}
                  </button>
                  
                  <button 
                    onClick={() => setInputText('')} 
                    className="text-slate-500 hover:text-slate-700 text-sm font-medium"
                  >
                    Clear Input
                  </button>
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-200 flex items-start gap-2">
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p>{error}</p>
                  </div>
                )}
              </div>
          </div>
        )}
      </div>
    </div>
  );
}