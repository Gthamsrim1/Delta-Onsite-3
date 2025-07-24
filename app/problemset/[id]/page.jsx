'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Play, Search, Filter, Clock, Users, TrendingUp, ExternalLink, Star, Building2, Menu, X, ChevronDown, CheckCircle, XCircle } from 'lucide-react'
import gsap from 'gsap';

const CodeEditorWithProblems = () => {
  const [code, setCode] = useState("");
  const [lang, setLang] = useState("Python");
  const [problems, setProblems] = useState([]);
  const [displayedProblems, setDisplayedProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [output, setOutput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [testCases, setTestCases] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  
  const sidebarRef = useRef(null);
  const mainContentRef = useRef(null);
  const problemsListRef = useRef(null);
  
  const PROBLEMS_PER_PAGE = 20;
  const ext = {"Python" : "py", "C++": "cpp", "Java": "java", "JavaScript": "js"};

  const scrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(30, 41, 59, 0.3);
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(148, 163, 184, 0.5);
      border-radius: 4px;
      border: 1px solid rgba(30, 41, 59, 0.3);
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(148, 163, 184, 0.7);
    }
  `;

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = scrollbarStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
      if (sidebarOpen) {
        gsap.to(sidebarRef.current, {
          duration: 0.3,
          x: 0,
          ease: "power2.out",
        });
        gsap.to(mainContentRef.current, {
          duration: 0.3,
          x: 0,
          ease: "power2.out",
        });
      } else {
        gsap.to(sidebarRef.current, {
          duration: 0.3,
          x: -320,
          ease: "power2.out",
        });
        gsap.to(mainContentRef.current, {
          duration: 0.3,
          x: 0,
          ease: "power2.out",
        });
      }
    }, [sidebarOpen]);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await fetch('/api/problems');
        const data = await response.json();
        setProblems(data);
        if (data.length > 0) {
          setSelectedProblem(data[0]);
          setDisplayedProblems(data.slice(0, PROBLEMS_PER_PAGE));
          setHasMore(data.length > PROBLEMS_PER_PAGE);
        }
      } catch (error) {
        console.error('Error fetching problems:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  const filteredProblems = problems.filter(problem => {
    const matchesSearch = problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         problem.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = difficultyFilter === "All" || problem.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  useEffect(() => {
    setCurrentPage(0);
    const newDisplayed = filteredProblems.slice(0, PROBLEMS_PER_PAGE);
    setDisplayedProblems(newDisplayed);
    setHasMore(filteredProblems.length > PROBLEMS_PER_PAGE);
  }, [searchTerm, difficultyFilter, problems]);

  const loadMoreProblems = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const nextPage = currentPage + 1;
    const startIndex = nextPage * PROBLEMS_PER_PAGE;
    const endIndex = startIndex + PROBLEMS_PER_PAGE;
    const newProblems = filteredProblems.slice(startIndex, endIndex);
    
    if (newProblems.length > 0) {
      setDisplayedProblems(prev => [...prev, ...newProblems]);
      setCurrentPage(nextPage);
      setHasMore(endIndex < filteredProblems.length);
    } else {
      setHasMore(false);
    }
    
    setLoadingMore(false);
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
    
    if (isNearBottom && hasMore && !loadingMore) {
      loadMoreProblems();
    }
  };

  const handleCodeRun = async () => {
    if (!code.trim()) {
      setOutput("Please enter some code to run.");
      return;
    }

    if (selectedProblem.test_cases.length === 0) {
      setOutput("No test cases available for this problem.");
      return;
    }

    setIsRunning(true);
    setOutput("Running test cases...");
    setTestResults([]);
    
    try {
      const response = await fetch('/api/code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code, 
          lang: ext[lang],
          test_cases: selectedProblem.test_cases
        })
      });
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setTestResults(data.results);
        const passedTests = data.results.filter(r => r.passed).length;
        const totalTests = data.results.length;
        setOutput(`Test Results: ${passedTests}/${totalTests} passed`);
      } else {
        setOutput(data.error || "An error occurred while running tests");
      }
    } catch (error) {
      setOutput("Error: " + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400 bg-green-400/10';
      case 'Medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'Hard': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading problems...</div>
      </div>
    );
  }

  return (
    <div className='bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 h-screen w-screen flex relative'>
      <div 
        ref={sidebarRef}
        className={`w-80 bg-slate-900/50 backdrop-blur-sm border-r border-gray-700 flex flex-col absolute h-full z-10 transition-transform duration-300 ease-out`}
      >
        <div className='p-4 border-b border-gray-700'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-white text-lg font-bold'>Problems</h2>
            <button
              onClick={toggleSidebar}
              className='p-1 hover:bg-white/10 rounded-md transition-colors'
            >
              <X className='w-5 h-5 text-gray-400 hover:text-white' />
            </button>
          </div>
          
          <div className='relative mb-3'>
            <Search className='absolute left-3 top-3 w-4 h-4 text-gray-400' />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full pl-10 pr-4 py-2 bg-slate-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm'
            />
          </div>
          
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className='w-full bg-slate-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm'
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <div className='mt-3 text-xs text-gray-400'>
            Showing {displayedProblems.length} of {filteredProblems.length} problems
          </div>
        </div>

        <div 
          ref={problemsListRef}
          className='flex-1 overflow-y-auto custom-scrollbar'
          onScroll={handleScroll}
        >
          {displayedProblems.map((problem) => (
            <div
              key={problem._id}
              onClick={() => setSelectedProblem(problem)}
              className={`p-4 border-b border-gray-700/30 cursor-pointer transition-all hover:bg-white/5 ${
                selectedProblem?._id === problem._id ? 'bg-blue-500/20 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className='flex items-start justify-between mb-2'>
                <div className='flex items-start gap-2 flex-1 min-w-0'>
                  <span className='text-gray-400 font-mono text-xs mt-0.5 shrink-0'>
                    {problem._id}.
                  </span>
                  <h3 className='text-white font-medium text-sm leading-tight flex-1 min-w-0'>
                    {problem.title}
                  </h3>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${getDifficultyColor(problem.difficulty)}`}>
                  {problem.difficulty}
                </div>
              </div>
              <div className='flex items-center gap-3 text-xs text-gray-400 mt-2 ml-6'>
                {problem.acceptance_rate && (
                  <span className='flex items-center gap-1'>
                    <TrendingUp className='w-3 h-3' />
                    {problem.acceptance_rate}
                  </span>
                )}
                {problem.frequency > 0 && (
                  <span className='flex items-center gap-1'>
                    <Clock className='w-3 h-3' />
                    {problem.frequency}
                  </span>
                )}
                {problem.asked_by_faang && (
                  <span className='flex items-center gap-1 text-yellow-400'>
                    <Star className='w-3 h-3' />
                    FAANG
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {loadingMore && (
            <div className='p-4 text-center text-gray-400'>
              <div className='flex items-center justify-center gap-2'>
                <div className='w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
                Loading more problems...
              </div>
            </div>
          )}
          
          {!hasMore && displayedProblems.length > 0 && (
            <div className='p-4 text-center text-gray-500 text-sm'>
              All problems loaded
            </div>
          )}
          
          {filteredProblems.length === 0 && (
            <div className='p-8 text-center text-gray-400'>
              <Search className='w-8 h-8 mx-auto mb-2 opacity-50' />
              <p>No problems found</p>
            </div>
          )}
        </div>
      </div>

      <div ref={mainContentRef} className='flex-1 flex flex-col p-4 gap-4 ml-0 transition-transform duration-300 ease-out'>
        <div className='flex items-center gap-4 mb-2'>
          {!sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className='p-2 bg-white/5 hover:bg-white/10 border border-gray-700 rounded-lg transition-colors'
            >
              <Menu className='w-5 h-5 text-gray-400 hover:text-white' />
            </button>
          )}
          <h1 className='text-white text-xl font-bold'>Code Editor</h1>
        </div>

        <div className='h-2/5 bg-white/5 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden'>
          {selectedProblem ? (
            <div className='h-full flex flex-col'>
              <div className='px-6 py-4 border-b border-gray-700/50 bg-white/5'>
                <div className='flex items-center justify-between mb-2'>
                  <h2 className='text-xl font-bold text-white flex items-center gap-3'>
                    <span className='text-gray-400 font-mono text-lg'>
                      {selectedProblem._id}.
                    </span>
                    {selectedProblem.title}
                  </h2>
                  <div className='flex items-center gap-2'>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(selectedProblem.difficulty)}`}>
                      {selectedProblem.difficulty}
                    </div>
                    {selectedProblem.is_premium && (
                      <div className='px-3 py-1 rounded-full text-sm font-medium text-orange-400 bg-orange-400/10'>
                        Premium
                      </div>
                    )}
                  </div>
                </div>
                <div className='flex items-center gap-6 text-sm text-gray-400'>
                  {selectedProblem.url && (
                    <a
                      href={selectedProblem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className='flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors'
                    >
                      <ExternalLink className='w-4 h-4' />
                      View on LeetCode
                    </a>
                  )}
                </div>
              </div>
              <div className='flex-1 p-6 overflow-y-auto custom-scrollbar'>
                <div className='text-gray-300 leading-relaxed whitespace-pre-wrap'>
                  {selectedProblem.description}
                </div>
                {selectedProblem.companies && selectedProblem.companies.length > 0 && (
                  <div className='mt-6'>
                    <h4 className='text-white font-medium mb-2 flex items-center gap-2'>
                      <Building2 className='w-4 h-4' />
                      Companies
                    </h4>
                    <div className='flex flex-wrap gap-2'>
                      {selectedProblem.companies.map((company, index) => (
                        <span key={index} className='px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm'>
                          {company}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedProblem.related_topics && selectedProblem.related_topics.length > 0 && (
                  <div className='mt-4'>
                    <h4 className='text-white font-medium mb-2'>Topics</h4>
                    <div className='flex flex-wrap gap-2'>
                      {selectedProblem.related_topics.map((topic, index) => (
                        <span key={index} className='px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm'>
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className='flex items-center justify-center h-full text-gray-400'>
              Select a problem to view details
            </div>
          )}
        </div>
        
        <div className='flex-1 flex gap-4 min-h-0 overflow-hidden'>
          <div className='flex-1 bg-white/5 backdrop-blur-sm border border-gray-700 rounded-xl flex flex-col overflow-hidden'>
            <div className='flex justify-between items-center px-4 py-3 border-b border-gray-700/50 bg-white/5'>
              <select 
                value={lang}
                onChange={e => setLang(e.target.value)}
                className='bg-slate-800 border border-gray-600 font-semibold px-4 py-2 cursor-pointer rounded-lg text-white focus:outline-none focus:border-blue-500'
              >
                <option value="Python">Python</option>
                <option value="C++">C++</option>
                <option value="Java">Java</option>
                <option value="JavaScript">JavaScript</option>
              </select>
              <button 
                onClick={handleCodeRun} 
                disabled={isRunning}
                className='px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed transition-all text-white duration-200 flex items-center gap-2 rounded-lg cursor-pointer font-medium'
              >
                {isRunning ? (
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                ) : (
                  <Play size={16}/>
                )}
                {isRunning ? 'Running...' : 'Run Code'}
              </button>
            </div>
            <textarea 
              value={code}
              onChange={e => setCode(e.target.value)} 
              placeholder={`Write your ${lang} solution here...`}
              className='flex-1 w-full text-gray-100 bg-transparent px-4 py-3 resize-none focus:outline-none font-mono text-sm leading-relaxed custom-scrollbar'
              style={{ minHeight: '200px', maxHeight: '300px' }}
            />
          </div>

          <div className='w-full md:w-[400px] flex flex-col gap-4 min-h-0 overflow-hidden'>
            <div className='flex-1 bg-white/5 backdrop-blur-sm border border-gray-700 rounded-xl flex flex-col overflow-hidden'>
              <div className='px-4 py-3 border-b border-gray-700/50 bg-white/5'>
                <h3 className='text-white font-medium'>Test Cases</h3>
                {selectedProblem?.test_cases.length > 0 && (
                  <p className='text-xs text-gray-400 mt-1'>{selectedProblem.test_cases.length} test case{selectedProblem.test_cases.length !== 1 ? 's' : ''} available</p>
                )}
              </div>
              <div className='flex-1 p-3 overflow-y-auto custom-scrollbar'>
                {loadingTestCases ? (
                  <div className='flex items-center justify-center h-full text-gray-400'>
                    <div className='flex items-center gap-2'>
                      <div className='w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
                      Loading test cases...
                    </div>
                  </div>
                ) : selectedProblem?.test_cases.length > 0 ? (
                  <div className='space-y-3'>
                    {selectedProblem.test_cases.map((testCase, index) => (
                      <div key={index} className='bg-slate-800/50 rounded-lg p-3 border border-gray-600/30'>
                        <div className='mb-2'>
                          <span className='text-gray-300 text-sm font-medium'>Test {index + 1}</span>
                        </div>
                        <div className='space-y-2'>
                          <div>
                            <label className='text-xs text-gray-400 block mb-1'>Input:</label>
                            <div className='w-full bg-slate-900 border border-gray-600 rounded px-2 py-1 text-gray-100 text-xs font-mono min-h-[2rem] whitespace-pre-wrap'>
                              {testCase.input || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <label className='text-xs text-gray-400 block mb-1'>Expected Output:</label>
                            <div className='w-full bg-slate-900 border border-gray-600 rounded px-2 py-1 text-gray-100 text-xs font-mono min-h-[2rem] whitespace-pre-wrap'>
                              {testCase.expected_output || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='flex items-center justify-center h-full text-gray-400'>
                    <div className='text-center'>
                      <p>No test cases available</p>
                      <p className='text-xs mt-1'>Select a problem to view test cases</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className='flex-1 bg-white/5 backdrop-blur-sm border border-gray-700 rounded-xl flex flex-col overflow-hidden min-h-0'>
              <div className='px-4 py-3 border-b border-gray-700/50 bg-white/5'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-white font-medium'>Test Results</h3>
                  {testResults.length > 0 && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      testResults.every(r => r.passed) 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {testResults.filter(r => r.passed).length}/{testResults.length} passed
                    </span>
                  )}
                </div>
              </div>
              <div className='flex-1 p-4 overflow-y-auto custom-scrollbar'>
                {testResults.length > 0 ? (
                  <div className='space-y-3'>
                    {testResults.map((result, index) => (
                      <div key={index} className={`border rounded-lg p-3 ${
                        result.passed 
                          ? 'border-green-500/30 bg-green-500/5' 
                          : 'border-red-500/30 bg-red-500/5'
                      }`}>
                        <div className='flex items-center gap-2 mb-2'>
                          {result.passed ? (
                            <CheckCircle className='w-4 h-4 text-green-400' />
                          ) : (
                            <XCircle className='w-4 h-4 text-red-400' />
                          )}
                          <span className={`text-sm font-medium ${
                            result.passed ? 'text-green-300' : 'text-red-300'
                          }`}>
                            Test {index + 1} {result.passed ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                        <div className='space-y-2 text-xs'>
                          <div>
                            <span className='text-gray-400'>Input: </span>
                            <span className='text-gray-300 font-mono whitespace-pre-wrap'>{result.input || 'N/A'}</span>
                          </div>
                          <div>
                            <span className='text-gray-400'>Expected: </span>
                            <span className='text-gray-300 font-mono whitespace-pre-wrap'>{result.expected || 'N/A'}</span>
                          </div>
                          <div>
                            <span className='text-gray-400'>Output: </span>
                            <span className={`font-mono whitespace-pre-wrap ${
                              result.passed ? 'text-green-300' : 'text-red-300'
                            }`}>
                              {result.output || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='flex items-center justify-center h-full text-gray-400'>
                    <div className='text-center'>
                      <p>{output || "Run your code to see test results here..."}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CodeEditorWithProblems