import React, { useEffect, useState } from 'react';
import config from "../config";
import axios from 'axios';
import { Plus, Trash2, Edit, Utensils, Search, X } from 'lucide-react';

const CanteenManager = () => {
  const [canteens, setCanteens] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCanteenId, setSelectedCanteenId] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    canteenId: '',
    name: '',
    description: '',
    price: '',
    category: '',
    isVeg: true,
  });

  useEffect(() => {
    fetchCanteens();
  }, []);

  useEffect(() => {
    if (selectedCanteenId) {
      fetchMenuItems(selectedCanteenId);
    } else {
      setMenuItems([]);
    }
  }, [selectedCanteenId]);

  const fetchCanteens = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/canteen`);
      const canteensData = response.data.data;
      setCanteens(canteensData);
      
      if (canteensData.length > 0) {
        setSelectedCanteenId(canteensData[0]._id);
        setFormData(prev => ({ ...prev, canteenId: canteensData[0]._id }));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching canteens:', error);
      setLoading(false);
    }
  };

  const fetchMenuItems = async (canteenId) => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/canteen/${canteenId}/items`);
      setMenuItems(response.data.data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`${config.API_BASE_URL}/canteen/items/${editingItem._id}`, formData);
      } else {
        await axios.post(`${config.API_BASE_URL}/canteen/${formData.canteenId}/items`, formData);
      }
      if (selectedCanteenId === formData.canteenId) {
        fetchMenuItems(selectedCanteenId);
      } else {
        setSelectedCanteenId(formData.canteenId);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`${config.API_BASE_URL}/canteen/items/${id}`);
        fetchMenuItems(selectedCanteenId);
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      canteenId: item.canteenId?._id || selectedCanteenId,
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category,
      isVeg: item.isVeg !== undefined ? item.isVeg : true,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({
      canteenId: selectedCanteenId,
      name: '',
      description: '',
      price: '',
      category: '',
      isVeg: true,
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const filteredItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="pt-4 lg:pt-0 pb-12 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-slate-200 rounded-2xl w-1/3"></div>
          <div className="h-96 glass-card rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4 lg:pt-0 pb-12 max-w-7xl mx-auto animate-fade-in-up">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Canteen Menu</h1>
          <p className="text-slate-500 mt-2 text-lg">Manage food items, prices, and availability.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg ${
            showForm 
            ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-slate-200/50' 
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/30 hover:-translate-y-0.5'
          }`}
        >
          {showForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Add New Item</>}
        </button>
      </div>

      {/* Form Overlay */}
      {showForm && (
        <div className="glass-card rounded-3xl p-8 mb-8 border border-white shadow-xl shadow-slate-200/50 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              {editingItem ? <Edit size={24} /> : <Plus size={24} />}
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              {editingItem ? 'Edit Menu Item' : 'Create Menu Item'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">Select Canteen</label>
              <select
                required
                value={formData.canteenId}
                onChange={(e) => setFormData({ ...formData, canteenId: e.target.value })}
                className="w-full px-5 py-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium text-slate-700"
              >
                <option value="" disabled>Select a canteen</option>
                {canteens.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700 ml-1">Item Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-5 py-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium text-slate-700"
                placeholder="e.g., Masala Dosa"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700 ml-1">Price (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full pl-10 pr-5 py-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium text-slate-700"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700 ml-1">Category</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-5 py-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium text-slate-700"
              >
                <option value="" disabled>Select category</option>
                <option value="Meals">Meals</option>
                <option value="Snacks">Snacks</option>
                <option value="Beverages">Beverages</option>
                <option value="Desserts">Desserts</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700 ml-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-5 py-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium text-slate-700"
                placeholder="Brief description of the dish"
              />
            </div>
            
            <div className="flex flex-col justify-end gap-3 pb-1 md:col-span-2">
              <div className="flex items-center gap-6 p-3 bg-white/50 border border-slate-200 rounded-xl w-fit">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={formData.isVeg}
                      onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                      className="peer sr-only"
                    />
                    <div className="w-6 h-6 border-2 border-slate-300 rounded-md peer-checked:bg-green-500 peer-checked:border-green-500 transition-all flex items-center justify-center">
                      <svg className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                  </div>
                  <span className="font-semibold text-slate-700 group-hover:text-green-600 transition-colors">Vegetarian</span>
                </label>
              </div>
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 hover:shadow-blue-500/40 transition-all duration-300"
              >
                {editingItem ? 'Save Changes' : 'Add Item to Menu'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Content Area */}
      <div className="glass-card rounded-3xl overflow-hidden border border-white shadow-xl shadow-slate-200/40">
        
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100/60 bg-white/40 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <select
              value={selectedCanteenId}
              onChange={(e) => setSelectedCanteenId(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all text-slate-700 min-w-[200px]"
            >
              {canteens.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>

            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>
          
          <div className="text-sm font-semibold text-slate-500 bg-white/80 px-4 py-2 rounded-lg border border-slate-100">
            {filteredItems.length} items found
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-xs uppercase tracking-wider font-bold text-slate-500 border-b border-slate-200/80">
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Utensils className="text-slate-300" size={32} />
                    </div>
                    <p className="text-lg font-bold text-slate-700 mb-1">No items found</p>
                    <p className="text-slate-400">Try adjusting your search or add a new item.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <p className="font-bold text-slate-800 text-base">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-slate-500 mt-0.5">{item.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold tracking-wide">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-700">₹{item.price}</td>
                    <td className="px-6 py-4">
                      {item.isVeg ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wide">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Veg
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-full uppercase tracking-wide">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span> Non-Veg
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2.5 text-blue-600 bg-white border border-slate-200 hover:border-blue-200 hover:bg-blue-50 rounded-xl transition-all shadow-sm"
                          title="Edit"
                        >
                          <Edit size={16} strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2.5 text-rose-600 bg-white border border-slate-200 hover:border-rose-200 hover:bg-rose-50 rounded-xl transition-all shadow-sm"
                          title="Delete"
                        >
                          <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CanteenManager;
