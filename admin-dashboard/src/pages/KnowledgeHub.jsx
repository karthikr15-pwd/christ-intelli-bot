import React, { useState } from 'react';
import config from "../config";
import { BookOpen, Calendar, Bell, Plus, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';

const KnowledgeHub = () => {
  const [activeTab, setActiveTab] = useState('courses');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Form States
  const [courseData, setCourseData] = useState({ code: '', title: '', syllabus: '' });
  const [eventData, setEventData] = useState({ name: '', date: '', description: '', type: 'Event' });
  const [announcementData, setAnnouncementData] = useState({ headline: '', content: '' });

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post(`${config.API_BASE_URL}/knowledge`, {
        itemType: 'Course',
        courseCode: courseData.code,
        title: courseData.title,
        corpus: courseData.syllabus
      });
      triggerToast();
      setCourseData({ code: '', title: '', syllabus: '' });
    } catch (error) {
      console.error('Error saving course:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post(`${config.API_BASE_URL}/knowledge`, {
        itemType: eventData.type,
        title: eventData.name,
        eventDate: eventData.date,
        corpus: eventData.description
      });
      triggerToast();
      setEventData({ name: '', date: '', description: '', type: 'Event' });
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post(`${config.API_BASE_URL}/knowledge`, {
        itemType: 'Announcement',
        title: announcementData.headline,
        corpus: announcementData.content
      });
      triggerToast();
      setAnnouncementData({ headline: '', content: '' });
    } catch (error) {
      console.error('Error saving announcement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header section */}
      <div className="flex justify-between items-end mb-8 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/50 text-blue-700 text-sm font-semibold mb-3 border border-blue-200/50">
            <Sparkles size={14} className="animate-pulse" />
            AI Brain Training
          </div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Knowledge Hub</h1>
          <p className="text-slate-500 mt-2 font-medium">Inject real-time data into the Intelli-Bot RAG system.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 bg-white/60 p-2 rounded-2xl backdrop-blur-md shadow-sm border border-white/50 w-fit">
        <button
          onClick={() => setActiveTab('courses')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'courses' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-600 hover:bg-white/50'
          }`}
        >
          <BookOpen size={18} /> Courses & Syllabus
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'events' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-slate-600 hover:bg-white/50'
          }`}
        >
          <Calendar size={18} /> Events & Holidays
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'announcements' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'text-slate-600 hover:bg-white/50'
          }`}
        >
          <Bell size={18} /> Announcements
        </button>
      </div>

      {/* Content Area */}
      <div className="glass rounded-3xl p-8 shadow-xl shadow-slate-200/40 relative overflow-hidden">
        {/* Background glow based on active tab */}
        <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 -z-10 transition-colors duration-500 ${
          activeTab === 'courses' ? 'bg-blue-500' : activeTab === 'events' ? 'bg-purple-500' : 'bg-orange-500'
        }`} />

        {/* Tab 1: Courses */}
        {activeTab === 'courses' && (
          <form onSubmit={handleSaveCourse} className="space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Course Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSC501"
                  className="w-full bg-white/70 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={courseData.code}
                  onChange={(e) => setCourseData({...courseData, code: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Artificial Intelligence"
                  className="w-full bg-white/70 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={courseData.title}
                  onChange={(e) => setCourseData({...courseData, title: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Syllabus & Details</label>
              <textarea
                required
                rows="6"
                placeholder="Paste the course syllabus, prerequisites, and learning outcomes here..."
                className="w-full bg-white/70 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                value={courseData.syllabus}
                onChange={(e) => setCourseData({...courseData, syllabus: e.target.value})}
              />
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                Save to AI Brain
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Events */}
        {activeTab === 'events' && (
          <form onSubmit={handleSaveEvent} className="space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Event/Holiday Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Christ Fest 2026 or Diwali Holiday"
                  className="w-full bg-white/70 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  value={eventData.name}
                  onChange={(e) => setEventData({...eventData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
                <select
                  className="w-full bg-white/70 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  value={eventData.type}
                  onChange={(e) => setEventData({...eventData, type: e.target.value})}
                >
                  <option value="Event">Event</option>
                  <option value="Holiday">Holiday</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
              <input
                type="date"
                required
                className="w-full md:w-1/3 bg-white/70 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                value={eventData.date}
                onChange={(e) => setEventData({...eventData, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description / Location</label>
              <textarea
                required
                rows="4"
                placeholder="Where is it happening? Who is organizing it? Provide details..."
                className="w-full bg-white/70 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                value={eventData.description}
                onChange={(e) => setEventData({...eventData, description: e.target.value})}
              />
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-purple-500/30 disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                Save to AI Brain
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Announcements */}
        {activeTab === 'announcements' && (
          <form onSubmit={handleSaveAnnouncement} className="space-y-6 animate-fade-in-up">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Headline</label>
              <input
                type="text"
                required
                placeholder="e.g. End Semester Exams Rescheduled"
                className="w-full bg-white/70 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                value={announcementData.headline}
                onChange={(e) => setAnnouncementData({...announcementData, headline: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Announcement Content</label>
              <textarea
                required
                rows="6"
                placeholder="Provide the full details of the announcement here..."
                className="w-full bg-white/70 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                value={announcementData.content}
                onChange={(e) => setAnnouncementData({...announcementData, content: e.target.value})}
              />
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-orange-500/30 disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                Broadcast to AI
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Success Toast */}
      <div className={`fixed bottom-8 right-8 transition-all duration-300 transform ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
        <div className="bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center gap-3 font-semibold">
          <CheckCircle2 size={24} />
          Knowledge successfully injected into AI!
        </div>
      </div>
    </div>
  );
};

export default KnowledgeHub;
