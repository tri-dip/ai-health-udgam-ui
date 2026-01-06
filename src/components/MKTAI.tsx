import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Brain, Search, AlertTriangle, CheckCircle, AlertCircle,
  Activity, ArrowRight, ScanLine, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';


interface UserProfile {
  allergies: string[];
  conditions: string[];
  goals: string[];
}

interface ProductData {
  product_name?: string | null;
  company_name?: string | null;
  IngredientList?: string[]; 
  NutritionFacts?: Record<string, string>; 
  MarketingClaims?: string[]; 
}

interface AgentResponse {
  user_query: string;
  user_profile?: UserProfile;
  image_data?: string | null; 
  product_json?: ProductData | ProductData[] | null; 
  plan?: string;
  search_needed?: boolean;
  search_queries?: string[];
  search_results?: string;
  final_verdict?: string; 
  reasoning?: string;
  next_suggestion?: string[];
  suggested_next_steps?: string[]; 
  conversation_summary?: string;
}

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  agentResponse?: AgentResponse;
  timestamp: Date;
  isStreaming?: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  allergies: [],
  conditions: [], 
  goals: []
};

const getValidProduct = (input: ProductData | ProductData[] | null | undefined): ProductData | null => {
  if (!input) return null;
  if (!Array.isArray(input)) return input;
  return input.find((item: any) => 
    typeof item === 'object' && 
    item !== null && 
    !Array.isArray(item) &&
    (typeof item.NutritionFacts === 'object' || typeof item.IngredientList === 'object')
  ) || null;
};

const ThinkingIndicator = ({ step }: { step: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 10, scale: 0.9 }}
    className="flex items-center gap-2 py-1.5 px-4 rounded-full bg-[#1a1a1a] border border-zinc-800 shadow-xl backdrop-blur-md"
  >
    <div className="relative flex items-center justify-center w-3.5 h-3.5">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full border-[1.5px] border-zinc-700 border-t-indigo-500"
      />
      <Sparkles className="w-2 h-2 text-indigo-400" />
    </div>
    <span className="text-[11px] font-medium text-zinc-300 tracking-wide">8112.AI: {step}</span>
  </motion.div>
);

const VerdictBadge = ({ verdict }: { verdict: string }) => {
  const v = verdict ? verdict.toUpperCase() : 'UNKNOWN';
  let style;

  if (v.includes('SAFE')) {
    style = { color: 'text-emerald-400', bg: 'bg-emerald-400/5', border: 'border-emerald-400/20', icon: CheckCircle };
  } else if (v.includes('AVOID')) {
    style = { color: 'text-rose-500', bg: 'bg-rose-500/5', border: 'border-rose-500/20', icon: AlertCircle };
  } else {
    style = { color: 'text-amber-400', bg: 'bg-amber-400/5', border: 'border-amber-400/20', icon: AlertTriangle };
  }

  const { color, bg, border, icon: Icon } = style;

  return (
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative overflow-hidden rounded-xl border ${border} ${bg} p-6`}
    >
      <div className="relative z-10 flex flex-row gap-5 items-center">
        <div className={`p-3 rounded-full bg-black/20 border ${border}`}>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
        <div>
          <h2 className={`text-4xl font-black tracking-tighter ${color} mb-1 uppercase`}>
            {verdict}
          </h2>
          <p className="text-zinc-400 text-xs font-medium tracking-wide uppercase">AI Health Assessment</p>
        </div>
      </div>
    </motion.div>
  );
};

const AgentResponseView = ({ 
  data, 
  onFollowUpClick, 
  isProcessing 
}: { 
  data: AgentResponse, 
  onFollowUpClick: (txt: string) => void,
  isProcessing: boolean 
}) => {
  const [showResults, setShowResults] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const product = getValidProduct(data.product_json);

  const planSteps = data.plan 
    ? data.plan.split('. ').filter(step => step.length > 5).slice(0, 5) 
    : [];

  const suggestions = (data.suggested_next_steps && data.suggested_next_steps.length > 0) 
    ? data.suggested_next_steps 
    : (data.next_suggestion || []);

  useEffect(() => {
    if (!isProcessing && data.final_verdict) {
      const timer = setTimeout(() => {
        setShowResults(true);
        setIsExpanded(false); 
      }, 1500); 
      
      return () => clearTimeout(timer);
    }
  }, [isProcessing, data.final_verdict]);

  return (
    <div className="space-y-6 w-full max-w-4xl">
      
      {data.plan && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden"
        >
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center gap-3 p-3 text-xs font-mono text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
          >
            {showResults ? (
               <CheckCircle className="w-4 h-4 text-emerald-500" />
            ) : (
               <Brain className="w-4 h-4 animate-pulse text-indigo-500" />
            )}
            
            <span className="uppercase tracking-wider font-bold">
              {showResults ? "Analysis Complete" : "Thinking"}
            </span>
            <div className="flex-1 h-px bg-zinc-800 mx-2" />
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4"
              >
                <div className="space-y-3 pl-2 border-l border-zinc-800 mt-2">
                  {planSteps.map((step, i) => {
                    return (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                          delay: i * 0.8, 
                          duration: 0.5 
                        }}
                        className="flex items-start gap-3 text-xs text-zinc-300 font-mono leading-relaxed"
                      >
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            showResults ? 'bg-emerald-500' : 'bg-indigo-500 animate-pulse'
                        }`} />
                        <span>{step.endsWith('.') ? step : `${step}.`}</span>
                      </motion.div>
                    );
                  })}
                  {data.plan && data.plan.split('. ').filter(s => s.length > 5).length > 5 && (
                      <div className="pl-5 text-[10px] text-zinc-600 font-mono italic">
                        ...and more checks
                      </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {showResults && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {data.final_verdict && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", bounce: 0.5 }} 
            >
              <VerdictBadge verdict={data.final_verdict} />
            </motion.div>
          )}

          {product && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }} 
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
               <div className="md:col-span-2 bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl">
                   <div className="flex items-baseline justify-between mb-4">
                     <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Ingredients</h3>
                     <span className="text-[10px] font-mono text-emerald-500">AI EXTRACTED</span>
                   </div>
                   <div className="flex flex-wrap gap-2">
                     {(product.IngredientList || []).length > 0 ? (
                        (product.IngredientList || []).map((ing, i) => (
                         <span key={i} className="px-2 py-1 bg-black border border-zinc-800 rounded text-xs text-zinc-300 font-mono cursor-default">
                           {ing}
                         </span>
                       ))
                     ) : (
                       <span className="text-xs text-zinc-600 italic">No ingredients detected.</span>
                     )}
                   </div>
               </div>
               
               <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl">
                   <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Nutrition</h3>
                   <div className="space-y-3">
                     {product.NutritionFacts && typeof product.NutritionFacts === 'object' && Object.entries(product.NutritionFacts).length > 0 ? (
                        Object.entries(product.NutritionFacts).map(([k, v]) => (
                         <div key={k} className="flex justify-between items-center text-sm border-b border-zinc-800/50 pb-2 last:border-0 last:pb-0">
                           <span className="text-zinc-500 capitalize">{k}</span>
                           <span className="font-mono text-zinc-200 font-bold">{String(v)}</span>
                         </div>
                       ))
                     ) : (
                        <span className="text-xs text-zinc-600 italic">No data available.</span>
                     )}
                   </div>
               </div>
            </motion.div>
          )}

          {(data.reasoning || data.search_results) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }} 
              className="prose prose-invert prose-sm max-w-none pl-1"
            >
               <div className="flex items-center gap-2 mb-2">
                 <Sparkles className="w-4 h-4 text-indigo-400" />
                 <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                   AI Analysis
                 </span>
               </div>
               <div className="text-zinc-300 leading-7 text-[15px] whitespace-pre-line font-medium">
                 {data.reasoning || data.search_results}
               </div>
            </motion.div>
          )}

          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.0 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-zinc-800/50"
            >
              {suggestions.map((s, i) => (
                <button 
                  key={i} 
                  onClick={() => !isProcessing && onFollowUpClick(s)}
                  disabled={isProcessing}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 transition-all text-left group disabled:opacity-50"
                >
                  <span className="text-xs text-zinc-400 group-hover:text-zinc-200 font-medium line-clamp-1">{s}</span>
                  <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:text-white" />
                </button>
              ))}
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};

const MKTAI: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentProcessLog, setCurrentProcessLog] = useState<string>('');
  
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentProcessLog, isProcessing]);

  const updateAgentMsg = (id: string, updates: Partial<AgentResponse>) => {
    setMessages(prev => prev.map(m => 
      m.id === id 
        ? { ...m, agentResponse: { ...(m.agentResponse || {} as AgentResponse), ...updates }, isStreaming: false } 
        : m
    ));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        sendPromptToBackend("Analyze this label", base64String, file);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendPromptToBackend = async (prompt: string, imageData: string | null, file: File | null = null) => {
    setIsProcessing(true);
    setCurrentProcessLog("Analyzing request..."); 

    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: userMsgId,
      type: 'user',
      content: prompt || "",
      timestamp: new Date()
    }]);

    const agentMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: agentMsgId,
      type: 'agent',
      content: '',
      agentResponse: { 
        user_query: prompt, 
        image_data: imageData 
      },
      timestamp: new Date(),
      isStreaming: true
    }]);
    
    let memoryContext = "";
    if (messages.length > 0) {
        const recentMessages = messages.slice(-6); 
        memoryContext = "PREVIOUS CONVERSATION CONTEXT:\n";
        
        recentMessages.forEach(m => {
           if (m.type === 'user') {
               memoryContext += `User: ${m.content}\n`;
           } else if (m.agentResponse) {
               memoryContext += `AI Verdict: ${m.agentResponse.final_verdict || 'Unknown'}\n`;
           }
        });
        memoryContext += "\nCURRENT QUESTION:\n";
    }

    const finalPromptToSend = memoryContext ? (memoryContext + prompt) : prompt;

    try {
      const formData = new FormData();
      
      const agentState = {
         user_query: finalPromptToSend, 
         user_profile: userProfile,
         image_data: null, 
         next_suggestion: [] 
      };

      formData.append("state_json", JSON.stringify(agentState));

      if (file) {
          formData.append("file", file);
      }

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/process`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!res.ok) {
        const errorDetail = await res.json();
        throw new Error(`Server Error ${res.status}: ${JSON.stringify(errorDetail)}`);
      }

      const data: AgentResponse = await res.json();
      
      if (imageData) {
          data.image_data = imageData;
      }
      
      if (data.user_profile) setUserProfile(data.user_profile);
      updateAgentMsg(agentMsgId, data);

      const planStepCount = data.plan ? Math.min(data.plan.split('. ').length, 5) : 3;
      const animationTime = Math.min(Math.max(planStepCount * 1000, 3000), 8000); 

      setCurrentProcessLog("Cross-referencing safety guidelines...");

      setTimeout(() => {
        setIsProcessing(false);
        setCurrentProcessLog('');
      }, animationTime);

    } catch (err: any) {
      console.error('Backend connection failed:', err);
      updateAgentMsg(agentMsgId, {
        final_verdict: 'CAUTION',
        reasoning: `Error connecting to AI Server: ${err.message}.`,
        product_json: null
      });
      setIsProcessing(false);
      setCurrentProcessLog('');
    } 
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputValue.trim() && !isProcessing) {
      sendPromptToBackend(inputValue, null, null);
      setInputValue('');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-zinc-100 font-sans selection:bg-zinc-800 overflow-x-hidden custom-scrollbar">
      
      <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #050505; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #444; }
      `}</style>
      
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />
      
      <div className="fixed inset-0 z-0 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #27272a 1px, transparent 0)', backgroundSize: '40px 40px', opacity: 0.3 }} />
      
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white rounded-sm flex items-center justify-center">
              <div className="w-2 h-2 bg-black rounded-full" />
            </div>
            <span className="font-bold tracking-tight text-sm">8112.AI</span>
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700">BETA</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
            <span className="hidden md:inline">
              FLAGS: {userProfile.allergies.length + userProfile.conditions.length}
            </span>
            <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto pt-24 pb-48 px-4 md:px-6 min-h-screen flex flex-col">
        
        {messages.length === 0 && !isProcessing && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center mt-20"
          >
            <div className="w-20 h-20 bg-zinc-900 rounded-3xl border border-zinc-800 flex items-center justify-center mb-8 shadow-2xl shadow-zinc-950">
              <Brain className="w-10 h-10 text-zinc-100" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Consumer Health <br/><span className="text-zinc-500">Decision Engine</span>
            </h1>
            <p className="text-zinc-500 max-w-md text-sm leading-relaxed mb-10">
              An AI-native co-pilot that helps you interpret food labels, understand ingredients, and make safe decisions based on your health profile.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="flex items-center gap-4 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800 hover:border-zinc-600 transition-all group text-left"
              >
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 group-hover:border-zinc-700">
                  <ScanLine className="w-6 h-6 text-zinc-400 group-hover:text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-200">Scan Food Label</div>
                  <div className="text-xs text-zinc-500 mt-0.5">Upload image or take photo</div>
                </div>
              </button>
              <button 
                onClick={() => sendPromptToBackend("Is Ashwagandha safe for hypothyroidism?", null, null)}
                className="flex items-center gap-4 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800 hover:border-zinc-600 transition-all group text-left"
              >
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 group-hover:border-zinc-700">
                  <Search className="w-6 h-6 text-zinc-400 group-hover:text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-200">Research Safety</div>
                  <div className="text-xs text-zinc-500 mt-0.5">Check interactions</div>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        <div className="space-y-12">
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.type === 'user' ? (
                <div className="bg-zinc-100 text-zinc-900 px-6 py-3.5 rounded-2xl rounded-tr-sm max-w-2xl shadow-lg font-medium text-sm">
                  {msg.content}
                </div>
              ) : (
                <div className="w-full max-w-4xl space-y-6">
                  {msg.agentResponse && (
                    <>
                      {msg.agentResponse.image_data && (
                        <div className="relative w-48 h-32 mb-6 rounded-xl overflow-hidden border border-zinc-800 group">
                          <img 
                            src={msg.agentResponse.image_data} 
                            alt="Uploaded Label" 
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-mono bg-black/50 px-2 py-1 rounded backdrop-blur text-white border border-white/10">ANALYZED SOURCE</span>
                          </div>
                        </div>
                      )}

                      <AgentResponseView 
                        data={msg.agentResponse} 
                        isProcessing={isProcessing}
                        onFollowUpClick={(txt) => sendPromptToBackend(txt, null, null)}
                      />
                    </>
                  )}
                </div>
              )}
            </motion.div>
          ))}
          
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent pointer-events-none" />
        
        <div className="relative max-w-3xl mx-auto px-4 pb-6 pt-10 flex flex-col items-center">
          
          <div className="absolute -top-6 left-0 right-0 flex justify-center pointer-events-none">
            <AnimatePresence>
              {isProcessing && currentProcessLog && (
                <ThinkingIndicator step={currentProcessLog} />
              )}
            </AnimatePresence>
          </div>

          <motion.form 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onSubmit={handleSubmit}
            className={`relative w-full flex items-center gap-3 p-2 pl-4 rounded-full border bg-[#1a1a1a] shadow-2xl transition-all ${
              isProcessing ? 'border-zinc-800 cursor-not-allowed opacity-50' : 'border-zinc-700/50 hover:border-zinc-600'
            }`}
          >
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
              disabled={isProcessing}
            >
              <Upload className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isProcessing ? "Processing..." : "Ask 8112.AI..."}
              disabled={isProcessing}
              className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-zinc-500 h-10 font-medium ml-2"
            />

            <button 
              type="submit" 
              disabled={!inputValue.trim() || isProcessing}
              className="p-2.5 bg-white text-black rounded-full hover:bg-zinc-200 transition-colors disabled:opacity-0 disabled:scale-90"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.form>
        </div>
      </div>

    </div>
  );
};

export default MKTAI;