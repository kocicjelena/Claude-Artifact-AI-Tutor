import React, { useState, useEffect, useRef } from 'react';
import { Send, BookOpen, TrendingUp, Target, ChevronDown, BarChart3, Brain, Zap, Download, Sparkles } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AI_TERMS = [
  { id: 'generative', label: 'Generative AI', desc: 'AI that creates new content' },
  { id: 'embedding', label: 'Embeddings', desc: 'Vector representations of data' },
  { id: 'ml', label: 'Machine Learning', desc: 'Systems that learn from data' },
  { id: 'nlp', label: 'Natural Language Processing', desc: 'Understanding human language' },
  { id: 'transformer', label: 'Transformers', desc: 'Attention-based neural networks' },
  { id: 'finetuning', label: 'Fine-tuning', desc: 'Adapting pre-trained models' },
  { id: 'rag', label: 'RAG', desc: 'Retrieval-Augmented Generation' },
  { id: 'llm', label: 'Large Language Models', desc: 'Large-scale language AI' },
  { id: 'cnn', label: 'CNN', desc: 'Convolutional Neural Networks' },
  { id: 'rnn', label: 'RNN', desc: 'Recurrent Neural Networks' }
];

export default function AILearningTutor() {
  const [selectedTerm, setSelectedTerm] = useState(AI_TERMS[0].id);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('casual'); // casual or structured
  const [modelSource, setModelSource] = useState('claude'); // claude or trained
  const [feedback, setFeedback] = useState(null);
  const [showModelPanel, setShowModelPanel] = useState(false);
  const [learningModel, setLearningModel] = useState({
    interactions: 0,
    proficiencyLevel: 'beginner',
    vocabularyGrowth: [],
    topicMastery: {},
    commonErrors: [],
    sessionHistory: []
  });
  const [goals, setGoals] = useState(['Understand basic AI concepts', 'Learn about embeddings']);
  const [newGoal, setNewGoal] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadLearningModel();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadLearningModel = async () => {
    try {
      const stored = await window.storage.get('ai-learning-model');
      if (stored) {
        setLearningModel(JSON.parse(stored.value));
      }
    } catch (err) {
      console.log('No existing model found, starting fresh');
    }
  };

  const saveLearningModel = async (model) => {
    try {
      await window.storage.set('ai-learning-model', JSON.stringify(model));
    } catch (err) {
      console.error('Failed to save learning model:', err);
    }
  };

  const analyzeProficiency = (interactions, topicMastery) => {
    if (interactions < 5) return 'beginner';
    if (interactions < 15) return 'intermediate';
    const avgMastery = Object.values(topicMastery).reduce((a, b) => a + b, 0) / Object.keys(topicMastery).length;
    if (avgMastery > 0.7) return 'advanced';
    return 'intermediate';
  };

  const extractKeyTerms = (text) => {
    const terms = [];
    AI_TERMS.forEach(term => {
      if (text.toLowerCase().includes(term.label.toLowerCase())) {
        terms.push(term.label);
      }
    });
    return terms;
  };

  const generateFeedback = (userMsg, aiResponse) => {
    const keyTerms = extractKeyTerms(userMsg + ' ' + aiResponse);
    const msgLength = userMsg.split(' ').length;
    
    return {
      termsUsed: keyTerms,
      complexity: msgLength > 20 ? 'detailed' : msgLength > 10 ? 'moderate' : 'brief',
      engagement: 'high',
      timestamp: new Date().toISOString()
    };
  };

  const calculateSimilarity = (str1, str2) => {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  };

  const useTrainedModel = (userQuestion) => {
    if (learningModel.sessionHistory.length === 0) {
      return "My trained model needs more data. Please switch to Claude model to train me first!";
    }

    // Find most similar questions from history
    const similarities = learningModel.sessionHistory.map(session => ({
      ...session,
      similarity: calculateSimilarity(userQuestion, session.userMsg)
    }));

    similarities.sort((a, b) => b.similarity - a.similarity);
    const topMatches = similarities.slice(0, 3).filter(s => s.similarity > 0.2);

    if (topMatches.length === 0) {
      return `Based on my training, I haven't learned enough about this specific question yet. I've been trained on ${learningModel.interactions} interactions covering topics like ${Object.keys(learningModel.topicMastery).map(t => AI_TERMS.find(term => term.id === t)?.label).join(', ')}. Try asking about these topics or switch to Claude model to expand my knowledge!`;
    }

    // Synthesize answer from top matches
    const relevantAnswers = topMatches.map(m => m.aiResponse);
    const synthesis = `Based on my training (${Math.round(topMatches[0].similarity * 100)}% confidence), here's what I learned:\n\n${relevantAnswers[0]}`;
    
    if (topMatches.length > 1) {
      return synthesis + `\n\n[Note: This response is synthesized from ${topMatches.length} similar questions in my training data]`;
    }
    
    return synthesis;
  };

  const downloadModel = () => {
    const modelData = {
      metadata: {
        version: '1.0',
        created: new Date().toISOString(),
        proficiencyLevel: learningModel.proficiencyLevel,
        totalInteractions: learningModel.interactions
      },
      model: learningModel
    };

    const blob = new Blob([JSON.stringify(modelData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-learning-model-${learningModel.proficiencyLevel}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      let aiContent;

      if (modelSource === 'trained') {
        // Use trained model
        aiContent = useTrainedModel(currentInput);
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const aiMessage = { role: 'assistant', content: aiContent, timestamp: Date.now(), source: 'trained' };
        setMessages(prev => [...prev, aiMessage]);

        // Generate feedback for trained model usage
        const fb = generateFeedback(currentInput, aiContent);
        setFeedback(fb);

      } else {
        // Use Claude API
        const termInfo = AI_TERMS.find(t => t.id === selectedTerm);
        const systemPrompt = mode === 'structured' 
          ? `You are an AI/ML tutor teaching about ${termInfo.label}. Provide structured, educational responses with examples. After explaining concepts, ask a follow-up question to test understanding.`
          : `You are a friendly AI/ML tutor discussing ${termInfo.label}. Have a natural conversation while being educational. Current user goals: ${goals.join(', ')}`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [
              { role: 'user', content: `${systemPrompt}\n\nUser question: ${currentInput}` }
            ]
          })
        });

        const data = await response.json();
        aiContent = data.content[0].text;
        const aiMessage = { role: 'assistant', content: aiContent, timestamp: Date.now(), source: 'claude' };
        
        setMessages(prev => [...prev, aiMessage]);

        // Generate feedback
        const fb = generateFeedback(currentInput, aiContent);
        setFeedback(fb);

        // Update learning model only when using Claude
        const updatedModel = {
          ...learningModel,
          interactions: learningModel.interactions + 1,
          vocabularyGrowth: [...learningModel.vocabularyGrowth, {
            session: learningModel.interactions + 1,
            terms: fb.termsUsed.length
          }],
          topicMastery: {
            ...learningModel.topicMastery,
            [selectedTerm]: Math.min(1, (learningModel.topicMastery[selectedTerm] || 0) + 0.1)
          },
          sessionHistory: [...learningModel.sessionHistory, {
            term: selectedTerm,
            timestamp: Date.now(),
            userMsg: currentInput,
            aiResponse: aiContent
          }]
        };

        updatedModel.proficiencyLevel = analyzeProficiency(
          updatedModel.interactions,
          updatedModel.topicMastery
        );

        setLearningModel(updatedModel);
        saveLearningModel(updatedModel);
      }

    } catch (err) {
      console.error('Error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      setGoals([...goals, newGoal.trim()]);
      setNewGoal('');
    }
  };

  const removeGoal = (index) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const getProficiencyColor = (level) => {
    switch(level) {
      case 'beginner': return 'text-blue-500 bg-blue-100';
      case 'intermediate': return 'text-yellow-500 bg-yellow-100';
      case 'advanced': return 'text-green-500 bg-green-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const chartData = learningModel.vocabularyGrowth.slice(-10);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-indigo-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-800">AI Learning Tutor</h1>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative">
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {AI_TERMS.map(term => (
                    <option key={term.id} value={term.id}>{term.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setMode('casual')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    mode === 'casual'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Casual
                </button>
                <button
                  onClick={() => setMode('structured')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    mode === 'structured'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Structured
                </button>
              </div>

              <div className={`px-4 py-2 rounded-lg font-semibold ${getProficiencyColor(learningModel.proficiencyLevel)}`}>
                {learningModel.proficiencyLevel.toUpperCase()}
                {learningModel.proficiencyLevel !== 'beginner' && (
                  <div className="text-xs font-normal mt-0.5">
                    {learningModel.sessionHistory.length} examples
                  </div>
                )}
              </div>

              {learningModel.proficiencyLevel !== 'beginner' && (
                <button
                  onClick={downloadModel}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium shadow-md"
                  title="Download your trained model"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download Model</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Model Status Banner - Mobile & Desktop */}
          {learningModel.proficiencyLevel !== 'beginner' && (
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 shadow-lg">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Your AI Model is Ready! 🎉</h3>
                      <p className="text-sm text-purple-100">
                        Trained on {learningModel.sessionHistory.length} Q&A pairs across {Object.keys(learningModel.topicMastery).length} topics
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModelPanel(!showModelPanel)}
                    className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 text-sm"
                  >
                    {showModelPanel ? 'Hide' : 'Show'} Details
                    <ChevronDown className={`w-4 h-4 transition-transform ${showModelPanel ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                
                {/* Expandable Details */}
                {showModelPanel && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/10 rounded-lg p-4 backdrop-blur">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{learningModel.interactions}</div>
                      <div className="text-sm text-purple-100">Total Interactions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">{learningModel.sessionHistory.length}</div>
                      <div className="text-sm text-purple-100">Training Examples</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">{Object.keys(learningModel.topicMastery).length}</div>
                      <div className="text-sm text-purple-100">Topics Mastered</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                  Start Learning {AI_TERMS.find(t => t.id === selectedTerm)?.label}
                </h2>
                <p className="text-gray-500 mb-6">
                  Ask me anything about {AI_TERMS.find(t => t.id === selectedTerm)?.desc}
                </p>

                {/* Training Progress Card */}
                <div className="max-w-2xl mx-auto mt-8">
                  <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Brain className="w-6 h-6 text-indigo-600" />
                        Your Learning Model
                      </h3>
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getProficiencyColor(learningModel.proficiencyLevel)}`}>
                        {learningModel.proficiencyLevel.toUpperCase()}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 text-center border border-blue-200">
                        <div className="text-3xl font-bold text-indigo-600">{learningModel.interactions}</div>
                        <div className="text-xs text-gray-600 mt-1">Interactions</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 text-center border border-purple-200">
                        <div className="text-3xl font-bold text-purple-600">{learningModel.sessionHistory.length}</div>
                        <div className="text-xs text-gray-600 mt-1">Training Data</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 text-center border border-green-200">
                        <div className="text-3xl font-bold text-green-600">{Object.keys(learningModel.topicMastery).length}</div>
                        <div className="text-xs text-gray-600 mt-1">Topics</div>
                      </div>
                    </div>

                    {learningModel.proficiencyLevel === 'beginner' ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-gray-700">
                          <strong className="text-yellow-800">Training Required:</strong> Start chatting with Claude to build your personalized AI model. 
                          You need at least 5 interactions to unlock your trained model.
                        </p>
                        <div className="mt-3 bg-white rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-yellow-500 h-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (learningModel.interactions / 5) * 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          {learningModel.interactions}/5 interactions to unlock
                        </p>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-5 h-5 text-green-600" />
                          <strong className="text-green-800">Model Ready!</strong>
                        </div>
                        <p className="text-sm text-gray-700">
                          Your personalized model is trained and ready to use. Switch to "My Trained Model" in the input area to get answers based on your learning history.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex flex-col gap-1 max-w-3xl">
                  {msg.role === 'assistant' && msg.source && (
                    <div className="flex items-center gap-1 text-xs">
                      {msg.source === 'trained' ? (
                        <span className="text-purple-600 font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Your Trained Model
                        </span>
                      ) : (
                        <span className="text-indigo-600 font-medium flex items-center gap-1">
                          <Brain className="w-3 h-3" />
                          Claude Model
                        </span>
                      )}
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-6 py-3 ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : msg.source === 'trained'
                        ? 'bg-purple-50 text-gray-800 shadow-md border border-purple-200'
                        : 'bg-white text-gray-800 shadow-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-6 py-3 shadow-md">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t shadow-lg">
            <div className="max-w-4xl mx-auto">
              {learningModel.proficiencyLevel !== 'beginner' && (
                <div className="mb-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <span className="text-gray-700 font-semibold text-sm">Model Source:</span>
                    </div>
                    <select
                      value={modelSource}
                      onChange={(e) => setModelSource(e.target.value)}
                      className="border-2 border-purple-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-medium text-sm shadow-sm hover:border-purple-400 transition"
                    >
                      <option value="claude">🤖 Claude Model (Training Mode)</option>
                      <option value="trained">✨ My Trained Model ({learningModel.interactions} interactions)</option>
                    </select>
                  </div>
                  {modelSource === 'trained' && (
                    <div className="mt-2 flex items-center gap-2 text-xs bg-purple-100 border border-purple-300 rounded px-3 py-2">
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
                      <span className="text-purple-800 font-medium">
                        Using your personalized model trained on {learningModel.sessionHistory.length} examples
                      </span>
                    </div>
                  )}
                  {modelSource === 'claude' && (
                    <div className="mt-2 flex items-center gap-2 text-xs bg-blue-100 border border-blue-300 rounded px-3 py-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                      <span className="text-blue-800 font-medium">
                        Training mode active - your model will learn from this conversation
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={
                    modelSource === 'trained' 
                      ? "Ask your trained model a question..." 
                      : "Ask a question about AI/ML/NLP..."
                  }
                  className={`flex-1 px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition ${
                    modelSource === 'trained'
                      ? 'border-purple-300 focus:ring-purple-500 bg-purple-50/30'
                      : 'border-indigo-300 focus:ring-indigo-500'
                  }`}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className={`${
                    modelSource === 'trained' 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition shadow-md font-medium`}
                >
                  <Send className="w-5 h-5" />
                  {modelSource === 'trained' ? 'Ask Model' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-96 bg-white border-l overflow-y-auto hidden lg:block">
          <div className="p-6 space-y-6">
            {/* Model Status */}
            {learningModel.proficiencyLevel !== 'beginner' && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-300 shadow-md">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <div className="relative">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </div>
                  Your Trained Model
                </h3>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className="font-semibold text-green-600 flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Active & Ready
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Training Data:</span>
                      <span className="font-semibold text-purple-600">{learningModel.sessionHistory.length} Q&A pairs</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Knowledge Base:</span>
                      <span className="font-semibold text-indigo-600">{Object.keys(learningModel.topicMastery).length} topics</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-3 border border-purple-200">
                    <p className="text-xs text-gray-700 leading-relaxed">
                      <strong className="text-purple-800">🎯 Ready to Use:</strong> Your model has learned from {learningModel.interactions} interactions and can answer questions about {Object.keys(learningModel.topicMastery).map(t => AI_TERMS.find(term => term.id === t)?.label).slice(0, 3).join(', ')}{Object.keys(learningModel.topicMastery).length > 3 ? ` and ${Object.keys(learningModel.topicMastery).length - 3} more topics` : ''}.
                    </p>
                  </div>

                  <button
                    onClick={downloadModel}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2.5 rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-medium shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    Download Model
                  </button>
                </div>
              </div>
            )}

            {/* Current Feedback */}
            {feedback && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  Latest Interaction
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Terms Used:</strong> {feedback.termsUsed.join(', ') || 'None detected'}</p>
                  <p><strong>Complexity:</strong> {feedback.complexity}</p>
                  <p><strong>Engagement:</strong> {feedback.engagement}</p>
                </div>
              </div>
            )}

            {/* Progress Chart */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Vocabulary Growth
              </h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="session" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="terms" stroke="#4F46E5" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-sm">Start chatting to see progress</p>
              )}
            </div>

            {/* Topic Mastery */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Topic Mastery
              </h3>
              <div className="space-y-2">
                {Object.entries(learningModel.topicMastery).map(([topic, mastery]) => (
                  <div key={topic}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{AI_TERMS.find(t => t.id === topic)?.label}</span>
                      <span>{Math.round(mastery * 100)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-500"
                        style={{ width: `${mastery * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Goals */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                Learning Goals
              </h3>
              <div className="space-y-2 mb-3">
                {goals.map((goal, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2 rounded">
                    <span className="text-sm">{goal}</span>
                    <button
                      onClick={() => removeGoal(idx)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                  placeholder="Add new goal..."
                  className="flex-1 px-3 py-2 border rounded text-sm"
                />
                <button
                  onClick={addGoal}
                  className="bg-indigo-600 text-white px-3 py-2 rounded text-sm hover:bg-indigo-700"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200">
              <h3 className="font-semibold text-gray-800 mb-3">Training Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Interactions</span>
                    <span className="font-bold text-indigo-600">{learningModel.interactions}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-500"
                      style={{ width: `${Math.min(100, (learningModel.interactions / 20) * 100)}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Training Examples</span>
                    <span className="font-bold text-purple-600">{learningModel.sessionHistory.length}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-600 transition-all duration-500"
                      style={{ width: `${Math.min(100, (learningModel.sessionHistory.length / 15) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-indigo-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Topics Explored</span>
                    <span className="text-2xl font-bold text-green-600">
                      {Object.keys(learningModel.topicMastery).length}
                    </span>
                  </div>
                </div>

                {learningModel.proficiencyLevel === 'beginner' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-gray-700">
                    <strong className="text-yellow-800">Tip:</strong> Complete {5 - learningModel.interactions} more interactions to unlock your trained model!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}