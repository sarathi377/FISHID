
import React from 'react';
import { Fish, Info, RefreshCw, Award, Activity, CheckCircle, AlertCircle, Thermometer } from 'lucide-react';
import { FishResult } from '../types';

interface FishAnalysisDashboardProps {
    result: FishResult;
    image: string | null;
    onNewScan: () => void;
}

const FishAnalysisDashboard: React.FC<FishAnalysisDashboardProps> = ({ result, image, onNewScan }) => {
    const getFreshnessColor = (grade: string) => {
        switch (grade) {
            case 'Excellent': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
            case 'Good': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
            case 'Fair': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'Poor': return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
        }
    };

    const getQualityColor = (grade: string) => {
        switch (grade) {
            case 'Premium': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
            case 'Good': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'Average': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'Below Average': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
            default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto animate-message-in">
            <div className="relative overflow-hidden bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
                {/* Ocean Gradient Header */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-cyan-900/40 via-blue-900/40 to-slate-900/0 pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

                {/* Top Actions */}
                <div className="relative z-10 flex justify-between items-center p-6 pb-2">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/20">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                        <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase">AI Analysis</span>
                    </div>
                    <button
                        onClick={onNewScan}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white transition-all bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl hover:scale-105 active:scale-95"
                    >
                        <RefreshCw className="w-3 h-3" /> New Scan
                    </button>
                </div>

                <div className="relative z-10 p-6 pt-2">

                    {/* Main Fish Identity Card */}
                    <div className="flex flex-col md:flex-row gap-8 mb-8">
                        {/* Image Section */}
                        <div className="relative flex-shrink-0 group">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                            <div className="relative w-full md:w-64 h-64 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
                                {image ? (
                                    <img src={image} alt={result.commonName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full text-slate-700">
                                        <Fish className="w-20 h-20" />
                                    </div>
                                )}
                                {result.confidence && (
                                    <div className="absolute bottom-3 left-3 right-3">
                                        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 flex items-center justify-between">
                                            <span className="text-xs text-slate-300 font-medium">Confidence</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-cyan-400" style={{ width: `${result.confidence}%` }}></div>
                                                </div>
                                                <span className="text-xs font-bold text-white">{result.confidence}%</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="flex-1 flex flex-col justify-center">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                                    {result.commonName || "Unknown Species"}
                                </h1>
                                <h2 className="text-xl text-cyan-400 italic mb-6 font-serif opacity-90">
                                    {result.scientificName}
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {result.category && (
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                        <Activity className="w-5 h-5 text-cyan-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Category</p>
                                            <p className="text-sm text-slate-200">{result.category}</p>
                                        </div>
                                    </div>
                                )}
                                {result.edibility && (
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Edibility</p>
                                            <p className="text-sm text-slate-200">{result.edibility}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                        {/* Left Column: Freshness & Quality */}
                        <div className="md:col-span-7 space-y-6">

                            {/* Freshness Section */}
                            {result.freshness && (
                                <div className="group relative p-6 bg-slate-800/50 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all duration-300">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                                                <Thermometer className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-100">Freshness</h3>
                                                <p className="text-xs text-slate-400">Biological condition analysis</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider ${getFreshnessColor(result.freshness.grade)}`}>
                                            {result.freshness.grade}
                                        </span>
                                    </div>

                                    <div className="mb-5">
                                        <div className="flex justify-between text-xs mb-2">
                                            <span className="text-slate-400 font-medium">Score</span>
                                            <span className="text-emerald-400 font-mono font-bold">{result.freshness.score}/100</span>
                                        </div>
                                        <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-600 to-green-400 shadow-[0_0_15px_rgba(52,211,153,0.5)] transition-all duration-1000 ease-out"
                                                style={{ width: `${result.freshness.score}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        {result.freshness.indicators.slice(0, 4).map((indicator, idx) => (
                                            <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                                <span className="text-xs text-emerald-100/80 font-medium truncate">{indicator}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quality Section */}
                            {result.quality && (
                                <div className="group relative p-6 bg-slate-800/50 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all duration-300">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform duration-300">
                                                <Award className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-100">Quality</h3>
                                                <p className="text-xs text-slate-400">Market value assessment</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider ${getQualityColor(result.quality.grade)}`}>
                                            {result.quality.grade}
                                        </span>
                                    </div>

                                    <div className="mb-5">
                                        <div className="flex justify-between text-xs mb-2">
                                            <span className="text-slate-400 font-medium">Score</span>
                                            <span className="text-purple-400 font-mono font-bold">{result.quality.score}/100</span>
                                        </div>
                                        <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-400 shadow-[0_0_15px_rgba(192,132,252,0.5)] transition-all duration-1000 ease-out"
                                                style={{ width: `${result.quality.score}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {result.quality.assessment && (
                                        <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                                            <p className="text-sm text-purple-100/80 italic leading-relaxed">
                                                "{result.quality.assessment}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right Column: Features & Habitat */}
                        <div className="md:col-span-5 space-y-6">
                            <div className="h-full p-6 bg-slate-900/60 rounded-2xl border border-white/5 flex flex-col">
                                <div className="flex items-center gap-3 mb-6">
                                    <Info className="w-5 h-5 text-cyan-400" />
                                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Key Features</h3>
                                </div>

                                {result.features && (
                                    <ul className="space-y-4 mb-8">
                                        {result.features.map((feature, idx) => (
                                            <li key={idx} className="flex gap-3 text-sm text-slate-300 group">
                                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0 group-hover:scale-150 transition-transform"></div>
                                                <span className="group-hover:text-cyan-100 transition-colors">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {result.habitat && (
                                    <div className="mt-auto pt-6 border-t border-white/5">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Natural Habitat</h4>
                                        <p className="text-sm text-slate-300 leading-relaxed">
                                            {result.habitat}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Footer - Error Display if exists */}
                    {result.error && (
                        <div className="mt-6 p-4 rounded-xl bg-red-400/10 border border-red-400/20 text-red-100 text-sm text-center">
                            {result.error}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default FishAnalysisDashboard;
