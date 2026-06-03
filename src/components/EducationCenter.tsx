/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Search, Filter, Clock, User, Heart, ChevronRight, 
  ArrowLeft, Leaf, Flame, Shield, Smile, Sparkles, BookMarked
} from 'lucide-react';
import { EducationArticle, EducationCategory } from '../types';
import { communityService } from '../communityService';

export default function EducationCenter() {
  const [articles, setArticles] = useState<EducationArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<EducationArticle | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<EducationCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Simple bookmark caching
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    loadArticles();
    // Load local bookmarks
    try {
      const saved = localStorage.getItem('scca_bookmarks');
      if (saved) setBookmarks(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, [selectedCategory]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const catParam = selectedCategory === 'all' ? undefined : selectedCategory;
      const data = await communityService.getArticles(catParam);
      setArticles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated;
    if (bookmarks.includes(id)) {
      updated = bookmarks.filter(b => b !== id);
    } else {
      updated = [...bookmarks, id];
    }
    setBookmarks(updated);
    try {
      localStorage.setItem('scca_bookmarks', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Filter list by search query
  const filteredArticles = articles.filter(art => {
    const rawSearch = searchQuery.toLowerCase().trim();
    if (!rawSearch) return true;
    return art.title.toLowerCase().includes(rawSearch) || 
           art.summary.toLowerCase().includes(rawSearch) ||
           art.content.toLowerCase().includes(rawSearch);
  });

  const getCategoryTheme = (cat: EducationCategory) => {
    switch (cat) {
      case 'nutrition':
        return { label: 'Nutrition & Diet', bg: 'bg-emerald-50 text-emerald-800 border-emerald-100', icon: <Leaf className="w-3.5 h-3.5" /> };
      case 'pain-management':
        return { label: 'Crisis Relief', bg: 'bg-red-50 text-red-800 border-red-105', icon: <Flame className="w-3.5 h-3.5" /> };
      case 'childcare':
        return { label: 'Pediatric Care', bg: 'bg-sky-50 text-sky-800 border-sky-100', icon: <Smile className="w-3.5 h-3.5" /> };
      case 'pregnancy':
        return { label: 'Maternal health', bg: 'bg-pink-50 text-pink-800 border-pink-100', icon: <Heart className="w-3.5 h-3.5" /> };
      default:
        return { label: 'General SCD', bg: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: <Shield className="w-3.5 h-3.5" /> };
    }
  };

  const renderArticleMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        return <h3 key={idx} className="text-sm font-extrabold text-slate-900 tracking-tight mt-5 mb-2 block uppercase">{trimmed.substring(4)}</h3>;
      }
      if (trimmed.startsWith('##')) {
        return <h2 key={idx} className="text-base font-black text-slate-900 tracking-tight mt-6 mb-3 block border-b border-slate-100 pb-1">{trimmed.substring(3)}</h2>;
      }
      if (trimmed.startsWith('-')) {
        return <li key={idx} className="list-disc ml-5 pl-1 text-xs text-slate-700 mb-1.5 font-normal leading-relaxed">{trimmed.substring(2)}</li>;
      }
      return <p key={idx} className="text-xs md:text-sm text-slate-600 leading-relaxed mb-3.5 font-normal">{trimmed}</p>;
    });
  };

  return (
    <div className="space-y-6">
      
      {/* ARTICLE DETAILS SCREENS */}
      {selectedArticle ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm max-w-3xl mx-auto space-y-5">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setSelectedArticle(null)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Education timeline
            </button>

            <button
              onClick={(e) => toggleBookmark(selectedArticle.id, e)}
              className="p-2 text-slate-400 hover:text-brand-600 rounded-xl hover:bg-slate-50 transition"
              title="Bookmark article"
            >
              <BookMarked className={`w-5 h-5 ${bookmarks.includes(selectedArticle.id) ? 'fill-brand-600 text-brand-600' : ''}`} />
            </button>
          </div>

          {/* Heading */}
          <div className="space-y-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${getCategoryTheme(selectedArticle.category).bg}`}>
                {getCategoryTheme(selectedArticle.category).label}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5" />
                {selectedArticle.readTime}
              </span>
            </div>
            <h1 className="text-lg md:text-2xl font-black text-slate-900 tracking-tight mt-2">{selectedArticle.title}</h1>
            <p className="text-xs text-slate-500 italic mt-1 font-normal leading-relaxed">
              Written by SCCA Expert • {selectedArticle.author}
            </p>
          </div>

          {/* Body */}
          <article className="prose prose-slate max-w-none">
            {renderArticleMarkdown(selectedArticle.content)}
          </article>

          {/* Educational Callout box */}
          <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-1 mt-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 block">SCCA Medical Notice</span>
            <p className="text-[11px] text-amber-900 font-semibold leading-relaxed">
              This education material is structured by certified hematologists under SCCA Africa directives. It is intended strictly for proactive guidance, never to override direct orders from your primary medical clinical specialists.
            </p>
          </div>
        </div>
      ) : (
        /* ARTICLES HUB DISPLAY LIST */
        <div className="space-y-6">
          
          {/* Top Banner and Quick Search */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="z-10 space-y-1">
              <span className="text-[9px] uppercase font-bold tracking-widest font-mono text-indigo-400">Knowledge Hub</span>
              <h2 className="text-lg md:text-xl font-black tracking-tight flex items-center gap-1.5">
                SCCA Warriors Education Portal
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </h2>
              <p className="text-xs text-slate-300 max-w-md">
                Stay updated with scientifically validated guides, clinical practices, and dietary paths curated by leading African hematology councils.
              </p>
            </div>

            {/* Search Input bar */}
            <div className="relative w-full md:w-64 z-10">
              <Search className="w-4 h-4 text-slate-450 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search medical guides..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 hover:bg-white/15 focus:bg-white focus:text-slate-900 outline-none rounded-2xl text-xs placeholder-slate-400 text-white transition border border-white/10 focus:border-white"
              />
            </div>
          </div>

          {/* Horizontal Category Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto space-x-1 whitespace-nowrap scrollbar-thin">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`py-1.5 px-4 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${selectedCategory === 'all' ? 'bg-slate-900 border border-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-55'}`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              All Content
            </button>
            <button
              onClick={() => setSelectedCategory('general-disease')}
              className={`py-1.5 px-4 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${selectedCategory === 'general-disease' ? 'bg-slate-900 border border-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-55'}`}
            >
              <Shield className="w-3.5 h-3.5" />
              General SCD
            </button>
            <button
              onClick={() => setSelectedCategory('nutrition')}
              className={`py-1.5 px-4 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${selectedCategory === 'nutrition' ? 'bg-slate-900 border border-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-55'}`}
            >
              <Leaf className="w-1.5 h-3.5 text-emerald-500" />
              Nutrition Diet
            </button>
            <button
              onClick={() => setSelectedCategory('pain-management')}
              className={`py-1.5 px-4 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${selectedCategory === 'pain-management' ? 'bg-slate-900 border border-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-55'}`}
            >
              <Flame className="w-3.5 h-3.5 text-red-500" />
              Crisis Management
            </button>
            <button
              onClick={() => setSelectedCategory('childcare')}
              className={`py-1.5 px-4 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${selectedCategory === 'childcare' ? 'bg-slate-900 border border-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-55'}`}
            >
              <Smile className="w-3.5 h-3.5 text-sky-500" />
              Child Care
            </button>
            <button
              onClick={() => setSelectedCategory('pregnancy')}
              className={`py-1.5 px-4 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${selectedCategory === 'pregnancy' ? 'bg-slate-900 border border-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-55'}`}
            >
              <Heart className="w-3.5 h-3.5 text-pink-500" />
              Pregnancy Advice
            </button>
          </div>

          {/* ARTICLES LISTING GRID */}
          {loading ? (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-[11px] text-slate-450 font-bold mt-3">Loading clinical articles...</p>
            </div>
          ) : filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredArticles.map((art) => {
                const theme = getCategoryTheme(art.category);
                const isBookmarked = bookmarks.includes(art.id);
                return (
                  <div
                    key={art.id}
                    onClick={() => setSelectedArticle(art)}
                    className="bg-white hover:bg-slate-50/40 p-5 rounded-3xl border border-slate-150 hover:shadow shadow-sm transition flex flex-col justify-between cursor-pointer group"
                  >
                    <div>
                      {/* Meta header block */}
                      <div className="flex justify-between items-center text-[10px]">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest border flex items-center gap-1 ${theme.bg}`}>
                          {theme.icon}
                          {theme.label}
                        </span>
                        
                        <div className="flex items-center gap-2.5">
                          <span className="text-slate-400 font-mono flex items-center gap-1 font-semibold">
                            <Clock className="w-3 h-3" />
                            {art.readTime}
                          </span>
                          <button
                            onClick={(e) => toggleBookmark(art.id, e)}
                            className="p-1 text-slate-350 hover:text-brand-600 transition"
                            title="Bookmark article"
                          >
                            <BookMarked className={`w-4 h-4 ${isBookmarked ? 'fill-brand-600 text-brand-600' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Heading title */}
                      <h3 className="font-extrabold text-slate-900 text-sm mt-3 tracking-tight group-hover:text-brand-600 transition leading-snug">
                        {art.title}
                      </h3>
                      {/* Summary text */}
                      <p className="text-[11px] text-slate-500 leading-normal font-normal mt-2">
                        {art.summary}
                      </p>
                    </div>

                    {/* Footer segment with read trigger */}
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold">Author: {art.author.split(',')[0]}</span>
                      <span className="text-xs font-bold text-brand-600 group-hover:text-brand-700 flex items-center gap-0.5 transition">
                        Read full article
                        <ChevronRight className="w-4 h-4 transition group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 border border-slate-100 text-center text-slate-400 shadow-sm">
              <BookOpen className="w-12 h-12 stroke-1 mx-auto text-slate-300" />
              <h4 className="font-extrabold text-slate-800 text-sm mt-3">No matching articles found</h4>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1">
                We couldn't locate any guides matching "{searchQuery}". Try selecting a different category block or shortening your keyword.
              </p>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
