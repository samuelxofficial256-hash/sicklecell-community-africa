/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, AlertTriangle, BookOpen, Trash2, ShieldCheck, Plus, Check,
  AlertCircle, ChevronRight, Edit2, ShieldAlert, Sparkles, BookMarked
} from 'lucide-react';
import { ForumPost, ForumComment, EducationArticle, EducationCategory } from '../types';
import { communityService } from '../communityService';

interface AdminDashboardProps {
  userId: string;
  showMessage: (text: string, type: 'success' | 'err') => void;
  onBack: () => void;
}

export default function AdminDashboard({ userId, showMessage, onBack }: AdminDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'moderation' | 'education'>('moderation');
  
  // User Management
  const [sandboxUsers, setSandboxUsers] = useState<any[]>([]);

  // Moderation
  const [flaggedPosts, setFlaggedPosts] = useState<ForumPost[]>([]);
  const [allComments, setAllComments] = useState<ForumComment[]>([]);
  
  // Educational CRUD State
  const [articles, setArticles] = useState<EducationArticle[]>([]);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [showArticleForm, setShowArticleForm] = useState(false);
  
  // Form values
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<EducationCategory>('general-disease');
  const [formSummary, setFormSummary] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formReadTime, setFormReadTime] = useState('5 min read');
  const [formAuthor, setFormAuthor] = useState('Hematology Specialist');

  useEffect(() => {
    loadAdminData();
  }, [activeSubTab]);

  const loadAdminData = async () => {
    try {
      // 1. Users
      const userList = communityService.getSandboxUsers();
      setSandboxUsers(userList);

      // 2. Moderation data
      const postsIncFlags = await communityService.getAllPostsIncludingFlagged();
      // Flagged posts are any post that has reports.length OR isAppropriate = false
      setFlaggedPosts(postsIncFlags.filter(p => p.reports.length > 0 || !p.isAppropriate));

      const commentsIncFlags = await communityService.getCommentsIncludingFlagged();
      setAllComments(commentsIncFlags.filter(c => c.reports.length > 0 || !c.isAppropriate));

      // 3. Articles
      const articleList = await communityService.getArticles();
      setArticles(articleList);
    } catch (e) {
      console.error(e);
    }
  };

  // ==========================================
  // USER HANDLERS
  // ==========================================
  const handleDeleteUser = (deleteId: string) => {
    if (deleteId === 'patient-af-001') {
      showMessage('Cannot delete the primary Admin account.', 'err');
      return;
    }
    if (window.confirm('Are you sure you want to permanently suspend this user account? This acts instant on our sandbox.')) {
      try {
        communityService.deleteUser(deleteId);
        showMessage('Sandbox user suspended completely.', 'success');
        loadAdminData();
      } catch (err) {
        showMessage('Failed to complete action', 'err');
      }
    }
  };

  // ==========================================
  // MODERATION ACTIONS
  // ==========================================
  const handleApprovePost = async (postId: string) => {
    try {
      await communityService.approvePost(postId);
      showMessage('Post cleared of flags and approved successfully!', 'success');
      loadAdminData();
    } catch (e) {
      showMessage('Failed to approve post', 'err');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Delete this community post completely? This is irreversible.')) {
      try {
        await communityService.deletePostModerator(postId);
        showMessage('Post and comment subthreads deleted.', 'success');
        loadAdminData();
      } catch (e) {
        showMessage('Failed to delete post', 'err');
      }
    }
  };

  const handleApproveComment = async (commentId: string) => {
    try {
      await communityService.approveComment(commentId);
      showMessage('Comment verified and approved.', 'success');
      loadAdminData();
    } catch (e) {
      showMessage('Failed to approve comment', 'err');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Delete comment completely?')) {
      try {
        await communityService.deleteCommentModerator(commentId);
        showMessage('Comment deleted.', 'success');
        loadAdminData();
      } catch (e) {
        showMessage('Failed to delete comment', 'err');
      }
    }
  };

  // ==========================================
  // ARTICLE CRUD
  // ==========================================
  const handleStartCreateArticle = () => {
    setEditingArticleId(null);
    setFormTitle('');
    setFormCategory('general-disease');
    setFormSummary('');
    setFormContent('');
    setFormReadTime('5 min read');
    setFormAuthor('SCCA Clinic Directors');
    setShowArticleForm(true);
  };

  const handleStartEditArticle = (art: EducationArticle) => {
    setEditingArticleId(art.id);
    setFormTitle(art.title);
    setFormCategory(art.category);
    setFormSummary(art.summary);
    setFormContent(art.content);
    setFormReadTime(art.readTime);
    setFormAuthor(art.author);
    setShowArticleForm(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim() || !formSummary.trim()) {
      showMessage('Please complete all article form segments.', 'err');
      return;
    }

    try {
      const payload = {
        title: formTitle,
        category: formCategory,
        summary: formSummary,
        content: formContent,
        readTime: formReadTime,
        author: formAuthor
      };

      await communityService.saveArticle(payload, editingArticleId || undefined);
      showMessage(editingArticleId ? 'Article updated.' : 'New medical article published.', 'success');
      setShowArticleForm(false);
      loadAdminData();
    } catch (e) {
      showMessage('Failed to compile and publish article.', 'err');
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this educational resource?')) {
      try {
        await communityService.deleteArticle(id);
        showMessage('Resource article removed successfully.', 'success');
        loadAdminData();
      } catch (e) {
        showMessage('Failed to delete article', 'err');
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-6">
      
      {/* Admin Title Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 text-white p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-black tracking-tight flex items-center gap-1.5">
              SCCA Central Administration
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h2>
            <p className="text-[10px] text-slate-300">Moderate discussions, manage clinical user database, publish verified education.</p>
          </div>
        </div>

        <button
          onClick={onBack}
          className="py-1 px-3 bg-white/10 hover:bg-white/15 text-white border border-white/20 text-[10px] rounded-lg transition font-extrabold cursor-pointer"
        >
          Close Panel
        </button>
      </div>

      {/* Sub Tabs Configuration */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-full">
        <button
          onClick={() => { setActiveSubTab('moderation'); setShowArticleForm(false); }}
          className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${activeSubTab === 'moderation' ? 'bg-slate-900 border border-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-55'}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
          Comments Moderation ({flaggedPosts.length + allComments.length})
        </button>
        
        <button
          onClick={() => { setActiveSubTab('education'); setShowArticleForm(false); }}
          className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${activeSubTab === 'education' ? 'bg-slate-900 border border-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-55'}`}
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          Clinical Guides Content ({articles.length})
        </button>

        <button
          onClick={() => { setActiveSubTab('users'); setShowArticleForm(false); }}
          className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${activeSubTab === 'users' ? 'bg-slate-900 border border-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-55'}`}
        >
          <Users className="w-3.5 h-3.5 text-teal-400" />
          User Registry ({sandboxUsers.length})
        </button>
      </div>

      {/* ==========================================
          SUB TAB 1: MODERATION
          ========================================== */}
      {activeSubTab === 'moderation' && (
        <div className="space-y-5">
          {/* Flagged Posts segment */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              Flagged Community Posts ({flaggedPosts.length})
            </h3>

            {flaggedPosts.length > 0 ? (
              <div className="space-y-3.5">
                {flaggedPosts.map((post) => (
                  <div key={post.id} className="p-4 bg-orange-50/30 border border-orange-100 rounded-2xl flex flex-col justify-between gap-3 relative">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-slate-700">Author: {post.authorName}</span>
                        <span className="text-orange-700 font-mono font-bold bg-orange-100 px-2 py-0.5 rounded">
                          {post.reports.length} Reports
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-900">{post.title}</h4>
                      <p className="text-[11px] text-slate-600 italic">"{post.content}"</p>
                    </div>

                    <div className="flex gap-2 justify-end pt-2.5 border-t border-orange-100/30">
                      <button
                        onClick={() => handleApprovePost(post.id)}
                        className="py-1 px-3 bg-white text-slate-800 border border-slate-200 hover:border-emerald-500 text-[10px] font-bold rounded-lg flex items-center gap-1 transition"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        Approve & Clear Flags
                      </button>
                      
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="py-1 px-3 bg-red-600 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 hover:bg-red-700 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete content
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50/60 rounded-2xl border border-slate-200 text-center text-slate-450 text-[11px]">
                <Check className="w-6 h-6 text-emerald-500 mx-auto" />
                <p className="font-bold mt-1.5">Discussion posts queue fully clear! No reported content.</p>
              </div>
            )}
          </div>

          {/* Flagged Comments Segment */}
          <div className="space-y-3.5 pt-2">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              Flagged Thread Replies ({allComments.length})
            </h3>

            {allComments.length > 0 ? (
              <div className="space-y-3.5">
                {allComments.map((comment) => (
                  <div key={comment.id} className="p-4 bg-orange-50/30 border border-orange-100 rounded-2xl flex flex-col justify-between gap-3 relative">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-semibold text-slate-700">Author: {comment.authorName}</span>
                        <span className="text-orange-700 font-mono font-bold bg-orange-100 px-2 rounded">
                          {comment.reports.length} Reports
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 italic">"{comment.content}"</p>
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-orange-100/30">
                      <button
                        onClick={() => handleApproveComment(comment.id)}
                        className="py-1 px-3 bg-white text-slate-800 border border-slate-200 hover:border-emerald-500 text-[10px] font-bold rounded-lg flex items-center gap-1 transition"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        Approve & Clear
                      </button>
                      
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="py-1 px-3 bg-red-600 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 hover:bg-red-700 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete response
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50/60 rounded-2xl border border-slate-200 text-center text-slate-450 text-[11px]">
                <Check className="w-6 h-6 text-emerald-500 mx-auto" />
                <p className="font-bold mt-1.5">Thread comments comments queue fully clear!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          SUB TAB 2: ARTICLES MANAGEMENT
          ========================================== */}
      {activeSubTab === 'education' && (
        <div className="space-y-5">
          {!showArticleForm ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-550 block font-mono">Current Articles Catalogue ({articles.length})</span>
                <button
                  onClick={handleStartCreateArticle}
                  className="py-1 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                >
                  <Plus className="w-4 h-4" />
                  Publish Article
                </button>
              </div>

              <div className="space-y-3">
                {articles.map((art) => (
                  <div key={art.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-120 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        {art.category}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-xs mt-2 truncate">{art.title}</h4>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{art.summary}</p>
                    </div>

                    {/* Manage actions */}
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleStartEditArticle(art)}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition"
                        title="Edit article"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(art.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                        title="Delete article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* CREATE OR EDIT FORM */
            <form onSubmit={handleSaveArticle} className="space-y-4 border border-slate-150 p-5 rounded-3xl bg-slate-50/40">
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-tight">
                {editingArticleId ? 'Modify Medical Resource' : 'Publish SCCA-Certified Article'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block uppercase">Article Title</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Optimal protein counts for pediatric warriors"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block uppercase">Clinical Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as EducationCategory)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-brand-500 transition"
                  >
                    <option value="general-disease">General Disease Info</option>
                    <option value="nutrition">Nutrition & Diet</option>
                    <option value="pain-management">Pain Crisis Relief</option>
                    <option value="childcare">Child Pediatric Care</option>
                    <option value="pregnancy">Pregnancy Support</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block uppercase">Author / Board Name</label>
                  <input
                    type="text"
                    required
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="SCCA Certified Hematology Panel"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-brand-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block uppercase">Estimated Read Time</label>
                  <input
                    type="text"
                    value={formReadTime}
                    onChange={(e) => setFormReadTime(e.target.value)}
                    placeholder="5 min read"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-brand-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 block uppercase">Summary Abstract</label>
                <input
                  type="text"
                  required
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="Keep it concise - summarizing key advice indicators directly."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-brand-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 block uppercase">Article contents (Markdown supported)</label>
                <textarea
                  required
                  rows={8}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={`Use simple ## Heading triggers and list points to highlight:
- Proactive guidelines
- Dosing pacing warnings
- SCCA contact checklists`}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-brand-500 transition font-sans resize-y"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowArticleForm(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer transition shadow"
                >
                  Save and Publish
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ==========================================
          SUB TAB 3: USER REGISTRY
          ========================================== */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <span className="text-xs font-bold text-slate-550 block font-mono">Simulated Sandbox Users database ({sandboxUsers.length})</span>
          
          <div className="space-y-3">
            {sandboxUsers.map((user) => (
              <div key={user.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center uppercase text-xs font-semibold font-mono">
                    {user.fullName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800 leading-tight">
                      {user.fullName}
                      {user.role === 'admin' && (
                        <span className="text-[8px] bg-amber-100 text-amber-850 font-bold px-1.5 py-0.2 rounded-full border border-amber-200 uppercase ml-2 select-none inline-block align-middle">
                          System Admin
                        </span>
                      )}
                    </h4>
                    <span className="text-[10px] text-slate-450 block font-mono leading-none mt-1">ID: {user.id} • {user.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-[9px] text-slate-400 block font-bold">Country: {user.country}</span>
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 font-mono">Genotype: {user.genotype}</span>
                  </div>

                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={user.role === 'admin'}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed"
                    title={user.role === 'admin' ? 'Primary admin cannot be deleted' : 'Suspend account'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
