import React, { useState, useEffect } from 'react';
import config from "../config";
import { BookOpen, AlertTriangle, Lightbulb, Bell, Building, Plus, CheckCircle2, Loader2, Trash2, Calendar } from 'lucide-react';
import axios from 'axios';

const CampusBrain = () => {
  const [activeCategory, setActiveCategory] = useState('ACADEMICS');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [records, setRecords] = useState([]);

  // Form States
  const [formData, setFormData] = useState({
    subCategory: '',
    title: '',
    contentDetails: '',
    expiryDate: ''
  });

  const categories = [
    { id: 'ACADEMICS', label: 'Academics', icon: BookOpen, color: 'blue' },
    { id: 'EVENTS_ANNOUNCEMENTS', label: 'Events & Announcements', icon: Bell, color: 'purple' },
    { id: 'INFRASTRUCTURE', label: 'Infrastructure', icon: Building, color: 'emerald' },
    { id: 'IT_SUPPORT', label: 'IT Support', icon: Lightbulb, color: 'orange' },
    { id: 'EMERGENCY', label: 'Emergency', icon: AlertTriangle, color: 'red' },
  ];

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/campus-brain/category/${activeCategory}`);
      setRecords(response.data.data || []);
    } catch (error) {
      console.error('Error fetching knowledge:', error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post(`${config.API_BASE_URL}/campus-brain/add`, {
        category: activeCategory,
        subCategory: formData.subCategory,
        title: formData.title,
        contentDetails: formData.contentDetails,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined
      });
      triggerToast();
      setFormData({ subCategory: '', title: '', contentDetails: '', expiryDate: '' });
      fetchRecords();
    } catch (error) {
      console.error('Error saving knowledge:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this knowledge record?')) {
      try {
        await axios.delete(`${config.API_BASE_URL}/campus-brain/delete/${id}`);
        fetchRecords();
      } catch (error) {
        console.error('Error deleting knowledge:', error);
      }
    }
  };

  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    fetchRecords();
  }, [activeCategory]);

  const filteredRecords = records; // Server already filters by category

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header section */}
      <div>
        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-2">Campus Brain CMS</h1>
        <p className="text-slate-500 font-medium">Categorized Knowledge Management for the Omniscient AI Oracle.</p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? `bg-${cat.color}-600 text-white shadow-lg shadow-${cat.color}-500/30 scale-105`
                  : 'bg-white/60 text-slate-600 hover:bg-white border border-white/50'
              }`}
            >
              <Icon size={24} className="mb-2" />
              <span className="text-xs font-bold text-center leading-tight">{cat.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Area */}
        <div className="glass rounded-3xl p-8 shadow-xl shadow-slate-200/40 relative overflow-hidden h-fit">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Plus size={20} className="text-blue-500" />
            Add New Record
          </h2>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Sub-Category</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hostels, Placements"
                  className="w-full bg-white/70 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.subCategory}
                  onChange={(e) => setFormData({...formData, subCategory: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Campus Hostel Rules"
                  className="w-full bg-white/70 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Content Details</label>
              <textarea
                required
                rows="6"
                placeholder="Paste the raw data, schedules, or rules here..."
                className="w-full bg-white/70 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                value={formData.contentDetails}
                onChange={(e) => setFormData({...formData, contentDetails: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Expiry Date (Optional)</label>
              <input
                type="date"
                className="w-full bg-white/70 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.expiryDate}
                onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
              />
              <p className="text-xs text-slate-400 mt-1">Leave blank if this is permanent knowledge.</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold transition-colors shadow-lg disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Inject into AI Knowledge Base'}
            </button>
          </form>
        </div>

        {/* Data Table Area */}
        <div className="glass rounded-3xl p-6 shadow-xl shadow-slate-200/40 flex flex-col h-[700px]">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BookOpen size={20} className="text-indigo-500" />
            Active Knowledge Nodes
          </h2>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {filteredRecords.length === 0 ? (
              <div className="text-center text-slate-400 py-10 mt-10">
                <p>No active records for this category.</p>
              </div>
            ) : (
              filteredRecords.map(record => (
                <div key={record._id} className="bg-white/80 p-4 rounded-2xl border border-slate-100 shadow-sm relative group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
                        {record.subCategory}
                      </span>
                      {record.expiryDate && (
                        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg flex items-center gap-1 border border-amber-200/50">
                          <Calendar size={12} />
                          Expires: {new Date(record.expiryDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => handleDelete(record._id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1">{record.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-3">{record.contentDetails}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Success Toast */}
      <div className={`fixed bottom-8 right-8 transition-all duration-300 transform z-50 ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
        <div className="bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center gap-3 font-semibold">
          <CheckCircle2 size={24} />
          Knowledge successfully injected!
        </div>
      </div>
    </div>
  );
};

export default CampusBrain;
