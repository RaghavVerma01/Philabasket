import React, { useState, useEffect, useContext } from 'react';
import { BookOpen, Award, Search, Lightbulb, ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react';
import Title from '../components/Title';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';

const KnowledgeCenter = () => {
    const { userData, token, backendUrl } = useContext(ShopContext);
    const [trivia, setTrivia] = useState([]);
    const [activeSlide, setActiveSlide] = useState({});
    const [showAnswer, setShowAnswer] = useState({});
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [userScore, setUserScore] = useState(0);
    const [leaderboard, setLeaderboard] = useState([]);
    const [presentation, setPresentation] = useState(null);
    const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
    const [presentationSlide, setPresentationSlide] = useState(1);
    const [presentationAutoPlay, setPresentationAutoPlay] = useState(true);

    // Fetch Trivia Data
    useEffect(() => {
        const fetchTrivia = async () => {
            try {
                const response = await axios.get(backendUrl + '/api/trivia/list');
                if (response.data.success) {
                    setTrivia(response.data.trivia);
                    // Initialize active slide for each trivia section
                    const initialSlides = {};
                    response.data.trivia.forEach((t) => {
                        initialSlides[t._id] = 0;
                    });
                    setActiveSlide(initialSlides);
                }
            } catch (error) {
                console.error("Failed to fetch trivia:", error);
            }
        };

        const fetchLeaderboard = async () => {
            try {
                const response = await axios.get(backendUrl + '/api/user/leaderboard');
                if (response.data.success) {
                    setLeaderboard(response.data.leaderboard);
                }
            } catch (error) {
                console.error("Failed to fetch leaderboard:", error);
            }
        };

        const fetchPresentation = async () => {
            try {
                const response = await axios.get(backendUrl + '/api/presentation/active');
                if (response.data.success) {
                    setPresentation(response.data.presentation);
                }
            } catch (error) {
                console.error("Failed to fetch presentation:", error);
            }
        };

        fetchTrivia();
        fetchLeaderboard();
        fetchPresentation();
    }, []);

    // Load answered questions from localStorage when userData is available
    useEffect(() => {
        if (userData && userData._id) {
            const key = `answeredTriviaQuestions_${userData._id}`;
            const stored = localStorage.getItem(key);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setAnsweredQuestions(new Set(parsed));
                } catch (e) {
                    console.error("Failed to parse answered questions from localStorage:", e);
                }
            }
        }
    }, [userData]);

    // Save answered questions to localStorage whenever it changes
    useEffect(() => {
        if (userData && userData._id && answeredQuestions.size > 0) {
            const key = `answeredTriviaQuestions_${userData._id}`;
            localStorage.setItem(key, JSON.stringify([...answeredQuestions]));
        }
    }, [answeredQuestions, userData]);

    // Auto-advance presentation slides
    useEffect(() => {
        if (!presentation || !presentationAutoPlay) return;

        const interval = setInterval(() => {
            setPresentationSlide(prev => prev + 1);
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(interval);
    }, [presentation, presentationAutoPlay]);

    // Update user score when userData changes
    useEffect(() => {
        if (userData) {
            setUserScore(userData.triviaScore || 0);
        }
    }, [userData]);

    // Handle Next Slide
    const nextSlide = (triviaId) => {
        const triviaSection = trivia.find(t => t._id === triviaId);
        if (triviaSection) {
            setActiveSlide(prev => ({
                ...prev,
                [triviaId]: (prev[triviaId] + 1) % triviaSection.trivia.length
            }));
            setShowAnswer(prev => ({ ...prev, [triviaId]: false }));
        }
    };

    // Handle Previous Slide
    const prevSlide = (triviaId) => {
        const triviaSection = trivia.find(t => t._id === triviaId);
        if (triviaSection) {
            setActiveSlide(prev => ({
                ...prev,
                [triviaId]: prev[triviaId] === 0 ? triviaSection.trivia.length - 1 : prev[triviaId] - 1
            }));
            setShowAnswer(prev => ({ ...prev, [triviaId]: false }));
        }
    };

    // Handle Answer Selection
    const selectAnswer = (triviaId, slideIndex, optionIndex) => {
        const key = `${triviaId}-${slideIndex}`;
        setSelectedAnswers(prev => ({
            ...prev,
            [key]: optionIndex
        }));
    };

    // Check Answer
    const checkAnswer = (triviaId, slideIndex) => {
        const triviaSection = trivia.find(t => t._id === triviaId);
        if (!triviaSection) return;

        const currentSlide = triviaSection.trivia[slideIndex];
        const key = `${triviaId}-${slideIndex}`;
        const selected = selectedAnswers[key];

        if (answeredQuestions.has(key)) return; // Already answered this question

        if (selected === currentSlide.correctAnswer) {
            setUserScore(prev => prev + 10); // 10 points for correct answer
            setAnsweredQuestions(prev => new Set(prev).add(key)); // Mark as answered
            submitScore(10);
        }

        setShowAnswer(prev => ({ ...prev, [triviaId]: true }));
    };

    // Submit Score to Backend
    const submitScore = async (points) => {
        if (!userData || !token) return;

        try {
            const response = await axios.post(backendUrl + '/api/user/update-trivia-score', {
                userId: userData._id,
                points
            }, { headers: { token } });

            if (response.data.success) {
                setUserScore(response.data.newScore);
            }
        } catch (error) {
            console.error("Failed to submit score:", error);
        }
    };

    return (
        <div className='bg-[#FCF9F4] text-black min-h-screen pt-10 pb-20 px-6 md:px-16 lg:px-24 font-serif'>
            
            {/* --- HEADER --- */}
            <div className='max-w-6xl mx-auto mb-16'>
                <div className='flex items-center gap-4 mb-4'>
                    <span className='h-[1.5px] w-12 bg-[#BC002D]'></span>
                    <p className='text-[10px] tracking-[0.6em] text-[#BC002D] uppercase font-black'>Educational Archive</p>
                </div>
                <h2 className='text-4xl md:text-6xl font-bold text-gray-900 tracking-tighter uppercase mb-6'>
                    Knowledge <span className='text-[#BC002D]'>Center.</span>
                </h2>
                <div className='relative max-w-xl'>
                    <input 
                        type="text" 
                        placeholder="Search the Philatelic Database..." 
                        className='w-full bg-white border border-gray-100 py-4 px-6 rounded-full shadow-sm text-sm focus:outline-none focus:border-[#BC002D]/30 transition-all font-sans'
                    />
                    <Search className='absolute right-5 top-1/2 -translate-y-1/2 text-gray-300' size={18} />
                </div>
            </div>

            <div className='max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12'>
                
                {/* LEFT: KNOWLEDGE GRID */}
                <div className='lg:col-span-8 space-y-12'>
                    {/* TRIVIA SLIDESHOWS */}
                    {trivia.length > 0 && (
                        <div className='space-y-8'>
                            {trivia.map((triviaSection, sectionIndex) => {
                                const currentSlide = trivia[sectionIndex] && trivia[sectionIndex].trivia[activeSlide[trivia[sectionIndex]._id]];
                                return (
                                    <section key={triviaSection._id} className='bg-gradient-to-br from-[#BC002D] to-[#80001f] rounded-[40px] p-10 text-white relative overflow-hidden'>
                                        <div className='relative z-10'>
                                            <h3 className='text-2xl font-bold uppercase tracking-tighter mb-2'>{triviaSection.title}</h3>
                                            {triviaSection.description && (
                                                <p className='text-gray-200 text-sm max-w-md font-sans mb-6'>{triviaSection.description}</p>
                                            )}

                                            {/* Slideshow */}
                                            {triviaSection.trivia.length > 0 && (
                                                <div className='space-y-6'>
                                                    {/* Question Card */}
                                                    <div className='bg-white/10 border border-white/20 rounded-2xl p-8 backdrop-blur-sm'>
                                                        <p className='text-[12px] font-black uppercase tracking-widest text-white/60 mb-4'>Question</p>
                                                        <h4 className='text-xl font-bold mb-6'>{currentSlide?.question}</h4>

                                                        {/* Options */}
                                                        <div className='space-y-3 mb-6'>
                                                            {currentSlide?.options?.map((option, optIndex) => {
                                                                const key = `${triviaSection._id}-${activeSlide[triviaSection._id]}`;
                                                                const isSelected = selectedAnswers[key] === optIndex;
                                                                const isCorrect = showAnswer[triviaSection._id] && optIndex === currentSlide?.correctAnswer;
                                                                const isWrong = showAnswer[triviaSection._id] && isSelected && optIndex !== currentSlide?.correctAnswer;

                                                                return (
                                                                    <button
                                                                        key={optIndex}
                                                                        onClick={() => !showAnswer[triviaSection._id] && selectAnswer(triviaSection._id, activeSlide[triviaSection._id], optIndex)}
                                                                        disabled={showAnswer[triviaSection._id]}
                                                                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                                                                            isCorrect ? 'bg-green-500 text-white border-green-500' :
                                                                            isWrong ? 'bg-red-500 text-white border-red-500' :
                                                                            isSelected ? 'bg-amber-100 border-amber-300 text-amber-800' :
                                                                            'bg-white/10 border-white/20 text-white/90 hover:bg-white/20'
                                                                        }`}
                                                                    >
                                                                        <div className='flex items-center gap-3'>
                                                                            <span className='font-bold'>{String.fromCharCode(65 + optIndex)}.</span>
                                                                            <span>{option}</span>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className='flex gap-4 mb-6'>
                                                            <button
                                                                onClick={() => checkAnswer(triviaSection._id, activeSlide[triviaSection._id])}
                                                                disabled={selectedAnswers[`${triviaSection._id}-${activeSlide[triviaSection._id]}`] === undefined || showAnswer[triviaSection._id] || answeredQuestions.has(`${triviaSection._id}-${activeSlide[triviaSection._id]}`)}
                                                                className='flex-1 py-3 bg-white text-black text-[10px] font-black uppercase rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                                                            >
                                                                {answeredQuestions.has(`${triviaSection._id}-${activeSlide[triviaSection._id]}`) ? 'Answered' : 'Check Answer'}
                                                            </button>
                                                            <button
                                                                onClick={() => setShowAnswer(prev => ({...prev, [triviaSection._id]: !prev[triviaSection._id]}))}
                                                                className='flex-1 py-3 border border-white/30 text-white text-[10px] font-black uppercase rounded-xl hover:bg-white/10 transition-all'
                                                            >
                                                                {showAnswer[triviaSection._id] ? 'Hide Answer' : 'Reveal Answer'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Navigation */}
                                                    <div className='flex items-center justify-between'>
                                                        <button
                                                            onClick={() => prevSlide(triviaSection._id)}
                                                            className='p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all'
                                                        >
                                                            <ChevronLeft size={20} />
                                                        </button>

                                                        <div className='text-center'>
                                                            <p className='text-[10px] font-black uppercase tracking-widest text-white/60'>
                                                                {activeSlide[triviaSection._id] + 1} of {triviaSection.trivia.length}
                                                            </p>
                                                            <div className='flex gap-2 mt-2 justify-center'>
                                                                {triviaSection.trivia.map((_, dotIndex) => (
                                                                    <button
                                                                        key={dotIndex}
                                                                        onClick={() => setActiveSlide(prev => ({...prev, [triviaSection._id]: dotIndex}))}
                                                                        className={`w-2 h-2 rounded-full transition-all ${
                                                                            activeSlide[triviaSection._id] === dotIndex ? 'bg-white w-6' : 'bg-white/30'
                                                                        }`}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={() => nextSlide(triviaSection._id)}
                                                            className='p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all'
                                                        >
                                                            <ChevronRight size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className='absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 blur-[100px]'></div>
                                    </section>
                                );
                            })}
                        </div>
                    )}

                    {/* PRESENTATION SLIDESHOW */}
                    {presentation && (
                        <section className='bg-black rounded-[40px] p-10 text-white relative overflow-hidden'>
                            <div className='relative z-10'>
                                <div className='flex flex-col gap-2 mb-6'>
                                    <h3 className='text-2xl font-bold uppercase tracking-tighter'>Live Presentation</h3>
                                    <p className='text-gray-200 text-sm font-sans'>{presentation.title}</p>
                                </div>

                                <div className='aspect-video bg-white/5 border border-white/20 rounded-2xl overflow-hidden'>
                                    <iframe
                                        src={`https://docs.google.com/gview?url=${encodeURIComponent(presentation.fileUrl)}&embedded=true`}
                                        className='w-full h-full border-0'
                                        title='Presentation Slideshow'
                                        allowFullScreen
                                    />
                                </div>
                            </div>
                            <div className='absolute -right-20 -bottom-20 w-64 h-64 bg-[#BC002D]/20 blur-[100px]'></div>
                        </section>
                    )}

                    {/* INTERACTIVE ANATOMY SECTION */}
                    {/* <section className='bg-black rounded-[40px] p-10 text-white relative overflow-hidden'>
                        <div className='relative z-10'>
                            <h3 className='text-2xl font-bold uppercase tracking-tighter mb-4'>Stamp Anatomy 101</h3>
                            <p className='text-gray-400 text-sm max-w-md font-sans mb-8'>Hover over the physical characteristics to understand how expert registrars evaluate a specimen.</p>
                            

                            <div className='aspect-video bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center relative'>
                                <div className='absolute top-1/4 left-1/4 w-4 h-4 bg-[#BC002D] rounded-full animate-ping'></div>
                                <span className='text-[10px] font-black uppercase tracking-[0.3em] text-white/20'>Interactive Specimen Map</span>
                            </div>
                        </div>
                        <div className='absolute -right-20 -bottom-20 w-64 h-64 bg-[#BC002D]/20 blur-[100px]'></div>
                    </section> */}
                </div>

                {/* RIGHT: LEADERBOARD & TOOLS */}
                <div className='lg:col-span-4 space-y-8'>
                    
                    {/* USER SCORE */}
                    <div className='bg-gradient-to-br from-[#BC002D] to-[#80001f] rounded-[32px] p-8 text-white'>
                        <Award className='mb-4 text-amber-300' size={32} />
                        <h4 className='text-lg font-bold uppercase mb-2'>Your Score</h4>
                        <p className='text-3xl font-black'>{userScore} pts</p>
                        <p className='text-[10px] text-white/60 uppercase font-black tracking-widest mt-2'>
                            Keep learning to climb the ranks!
                        </p>
                    </div>

                    {/* LEADERBOARD */}
                    <div className='bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm'>
                        <div className='flex items-center gap-3 mb-6'>
                            <Award className='text-amber-500' size={24} />
                            <h4 className='text-xs font-black uppercase tracking-widest'>Top Collectors</h4>
                        </div>
                        
                        <div className='space-y-4'>
                            {leaderboard.length > 0 ? (
                                leaderboard.slice(0, 5).map((user, index) => (
                                    <div key={user._id} className='flex items-center justify-between p-3 bg-gray-50 rounded-xl'>
                                        <div className='flex items-center gap-3'>
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                index === 0 ? 'bg-yellow-500 text-white' :
                                                index === 1 ? 'bg-gray-400 text-white' :
                                                index === 2 ? 'bg-amber-600 text-white' :
                                                'bg-gray-200 text-gray-700'
                                            }`}>
                                                {index + 1}
                                            </span>
                                            <span className='text-sm font-bold'>{user.name}</span>
                                        </div>
                                        <span className='text-sm text-gray-600'>{user.triviaScore || 0} pts</span>
                                    </div>
                                ))
                            ) : (
                                <p className='text-center py-4 text-gray-500 text-sm'>No leaderboard data yet</p>
                            )}
                        </div>
                    </div>

                    {/* VALUATION TOOL PREVIEW */}
                    {/* <div className='bg-gradient-to-br from-[#BC002D] to-[#80001f] rounded-[32px] p-8 text-white'>
                        <Lightbulb size={32} className='mb-6 opacity-50' />
                        <h4 className='text-lg font-bold uppercase mb-2'>Valuation Tool</h4>
                        <p className='text-[10px] text-white/60 uppercase font-black tracking-widest leading-loose mb-6'>
                            Get an instant archive estimate for your specimens.
                        </p>
                        <button className='flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border-b border-white/30 pb-1 hover:border-white transition-all'>
                            Access Tool <ChevronRight size={14} />
                        </button>
                    </div> */}

                </div>
            </div>
        </div>
    );
};

export default KnowledgeCenter;