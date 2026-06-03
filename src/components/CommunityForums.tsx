/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Heart, AlertTriangle, Send, Sparkles, 
  User, CheckCircle, Clock, ChevronRight, PlusCircle, Bookmark, ArrowLeft
} from 'lucide-react';
import { ForumPost, ForumComment, ForumCategory } from '../types';
import { communityService } from '../communityService';

interface CommunityForumsProps {
  userId: string;
  userName: string;
  showMessage: (text: string, type: 'success' | 'err') => void;
}

export default function CommunityForums({ userId, userName, showMessage }: CommunityForumsProps) {
  const [activeForum, setActiveForum] = useState<ForumCategory>('patient');
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Post state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  // Selected Post Details mode (Thread View)
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    loadForumPosts();
  }, [activeForum, selectedPost]);

  const loadForumPosts = async () => {
    try {
      setLoading(true);
      const data = await communityService.getPosts(activeForum);
      setPosts(data);
      
      // If we are viewing a thread, refresh that thread detail too
      if (selectedPost) {
        const freshPosts = await communityService.getPosts();
        const freshSelected = freshPosts.find(p => p.id === selectedPost.id);
        if (freshSelected) {
          setSelectedPost(freshSelected);
        }
        const commentData = await communityService.getComments(selectedPost.id);
        setComments(commentData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      await communityService.createPost(userId, userName, newTitle, newContent, activeForum);
      setNewTitle('');
      setNewContent('');
      setShowCreateModal(false);
      showMessage('Community topic published successfully!', 'success');
      loadForumPosts();
    } catch (err: any) {
      showMessage(err.message || 'Failed to publish topic', 'err');
    }
  };

  const handleLikePost = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await communityService.likePost(postId, userId);
      if (updated) {
        // Toggle in posts array directly for instant snappy feedback
        setPosts(posts.map(p => p.id === postId ? { ...p, likes: updated.likes } : p));
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost({ ...selectedPost, likes: updated.likes });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReportPost = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you calling attention to inappropriate clinical claims or spam on this post? SCCA moderators will inspect it immediately.')) {
      try {
        await communityService.reportPost(postId, userId);
        showMessage('Post reported safely. Support team notified.', 'success');
        // Refresh
        loadForumPosts();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !newCommentText.trim()) return;

    try {
      setSubmittingComment(true);
      await communityService.addComment(selectedPost.id, userId, userName, newCommentText);
      setNewCommentText('');
      showMessage('Comment posted!', 'success');
      
      // Refresh comments and counts
      const commentData = await communityService.getComments(selectedPost.id);
      setComments(commentData);
      loadForumPosts();
    } catch (err: any) {
      showMessage('Failed to publish comment', 'err');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReportComment = async (commentId: string) => {
    if (window.confirm('Do you want to report this comment for moderation?')) {
      try {
        await communityService.reportComment(commentId, userId);
        showMessage('Comment flagged code logged. Thank you.', 'success');
        // Refresh
        if (selectedPost) {
          const commentData = await communityService.getComments(selectedPost.id);
          setComments(commentData);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Thread Detail Screen (Nested Navigation) */}
      {selectedPost ? (
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-5">
          <button
            onClick={() => { setSelectedPost(null); setComments([]); }}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to standard board listing
          </button>

          {/* MAIN POST TITLE CARD */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative">
            <div className="flex justify-between items-start gap-4">
              <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full inline-block ${selectedPost.category === 'patient' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                {selectedPost.category} forum
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(selectedPost.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <h3 className="font-extrabold text-slate-900 text-sm md:text-base mt-2.5">{selectedPost.title}</h3>
            
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed mt-3 whitespace-pre-wrap font-normal">
              {selectedPost.content}
            </p>

            <div className="flex items-center gap-2.5 mt-4 pt-3.5 border-t border-slate-200/50">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 uppercase text-[10px] font-semibold flex items-center justify-center">
                {selectedPost.authorName.charAt(0)}
              </div>
              <div className="min-w-0 mr-auto">
                <span className="text-[10px] font-bold text-slate-700 block">{selectedPost.authorName}</span>
                <span className="text-[9px] text-slate-400 block">SCCA Warrior member</span>
              </div>

              {/* Likes and report stats inside thread detail */}
              <div className="flex gap-2">
                <button
                  onClick={(e) => handleLikePost(selectedPost.id, e)}
                  className={`py-1 px-3.5 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer ${selectedPost.likes.includes(userId) ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500'}`}
                >
                  <Heart className={`w-3.5 h-3.5 ${selectedPost.likes.includes(userId) ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{selectedPost.likes.length} Likes</span>
                </button>
                <button
                  onClick={(e) => handleReportPost(selectedPost.id, e)}
                  className="py-1 px-2 hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-100 rounded-xl transition"
                  title="Report spam/claims"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* COMMENTS LISTS */}
          <div className="space-y-3.5 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Discussion replies ({comments.length})</h4>
            
            {comments.length > 0 ? (
              <div className="space-y-3.5">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-3.5 bg-white rounded-2xl border border-slate-150 flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 uppercase text-xs font-semibold flex items-center justify-center shrink-0 border border-slate-200">
                      {comment.authorName.charAt(0)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-700">{comment.authorName}</span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {new Date(comment.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">{comment.content}</p>
                      <button
                        onClick={() => handleReportComment(comment.id)}
                        className="text-[9px] text-slate-400 hover:text-red-500 block text-right pt-1 transition"
                      >
                        Report reply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400">
                <MessageSquare className="w-7 h-7 mx-auto stroke-1" />
                <p className="text-[11px] font-semibold mt-1">No community comments yet. Start the conversation!</p>
              </div>
            )}
          </div>

          {/* ADD COMMENT FORM */}
          <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-100 flex gap-2.5">
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Post a secure medical check-in response or comment..."
              disabled={submittingComment}
              className="flex-1 px-4 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 text-xs rounded-xl focus:ring-1 focus:ring-brand-500 outline-none transition"
            />
            <button
              type="submit"
              disabled={submittingComment || !newCommentText.trim()}
              className="py-2 px-4 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Reply</span>
            </button>
          </form>
        </div>
      ) : (
        /* STANDARD LISTINGS SCREEN */
        <div className="space-y-5">
          {/* Forum Categories Switches */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex bg-slate-100 p-1 rounded-2xl space-x-1 w-full sm:w-auto">
              <button
                onClick={() => setActiveForum('patient')}
                className={`flex-1 sm:flex-initial py-1.5 px-6 rounded-xl font-bold text-xs transition cursor-pointer ${activeForum === 'patient' ? 'bg-slate-900 border border-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-55'}`}
              >
                Patient Forum (Warriors)
              </button>
              <button
                onClick={() => setActiveForum('caregiver')}
                className={`flex-1 sm:flex-initial py-1.5 px-6 rounded-xl font-bold text-xs transition cursor-pointer ${activeForum === 'caregiver' ? 'bg-slate-900 border border-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-55'}`}
              >
                Caregiver Forum (Support)
              </button>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto py-1.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow shadow-brand-500/10 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish Topic</span>
            </button>
          </div>

          {/* Modal Overlay / Popup for Creating Posts */}
          {showCreateModal && (
            <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl relative border border-slate-100 animate-in fade-in-50 zoom-in-95">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest block font-mono">Create on SCCA board</span>
                <h3 className="font-extrabold text-slate-900 text-sm md:text-base mt-1">Publish New Community Topic</h3>
                
                <p className="text-[10px] text-slate-500 leading-normal mt-1.5">
                  Your post will live immediately under the **{activeForum}** board where peers and supporters can check in. Be supportive and helpful!
                </p>

                <form onSubmit={handleCreatePost} className="space-y-4 mt-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 block uppercase">Topic Title or Concern</label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Tips for hydration pacing at work"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 block uppercase">Description details</label>
                    <textarea
                      required
                      rows={5}
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Share your experiences, triggers, questions, or clinical supplement adherence methods..."
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white transition resize-none"
                    />
                  </div>

                  <div className="flex gap-2.5 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="py-2 px-5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs transition shadow-lg shadow-brand-500/15 cursor-pointer"
                    >
                      Publish Topic
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* POSTS LIST TIMELINE */}
          {loading ? (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-[11px] text-slate-450 font-bold mt-3">Loading discussion timeline...</p>
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => {
                const hasLiked = post.likes.includes(userId);
                return (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="bg-white hover:bg-slate-50/50 p-5 rounded-3xl border border-slate-150 shadow-sm hover:shadow transition cursor-pointer flex flex-col justify-between group relative"
                  >
                    <div>
                      {/* Meta information row */}
                      <div className="flex justify-between items-center text-[10px] text-slate-450">
                        <div className="flex items-center gap-1.5 font-bold text-slate-700">
                          <div className="w-5 h-5 rounded-full bg-slate-100 font-bold text-[9px] text-slate-600 flex items-center justify-center uppercase">
                            {post.authorName.charAt(0)}
                          </div>
                          <span>{post.authorName}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span className="font-normal text-[9px] bg-slate-100 px-2 rounded-full uppercase">SCD Warrior</span>
                        </div>
                        <span className="font-mono text-[9px]">{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>

                      {/* Main Title */}
                      <h4 className="font-extrabold text-slate-900 text-sm mt-3 group-hover:text-brand-600 transition tracking-tight">
                        {post.title}
                      </h4>
                      {/* Truncated block text */}
                      <p className="text-xs text-slate-500 leading-relaxed font-normal mt-2 line-clamp-2">
                        {post.content}
                      </p>
                    </div>

                    {/* Interactive controls and feedback row */}
                    <div className="flex items-center gap-4 mt-4 pt-3.5 border-t border-slate-100">
                      {/* Likes count */}
                      <button
                        onClick={(e) => handleLikePost(post.id, e)}
                        className={`py-1 px-3.5 bg-slate-50 hover:bg-slate-105 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition ${hasLiked ? 'text-rose-600 bg-rose-50/80' : 'text-slate-500 bg-slate-50'}`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                        <span>{post.likes.length}</span>
                      </button>

                      {/* Comment count toggle */}
                      <span className="py-1 px-3.5 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span>{post.commentCount || 0} Replies</span>
                      </span>

                      {/* Report inappropriate flag */}
                      <button
                        onClick={(e) => handleReportPost(post.id, e)}
                        className="p-1 px-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg ml-auto transition"
                        title="Report this post"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 border-2 border-dashed border-slate-200 text-center text-slate-500">
              <MessageSquare className="w-12 h-12 mx-auto stroke-1 text-slate-300" />
              <h4 className="font-extrabold text-slate-800 text-sm mt-3">No community discussions here</h4>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto mt-1">
                Be the very first warrior to post. Let SCCA Africa know how your supplemental medication and pain schedules are holding!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 py-2 px-5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs inline-block cursor-pointer shadow-lg shadow-brand-500/10"
              >
                Create First Discussion
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
