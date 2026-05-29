import React, { useEffect, useState } from 'react';
import config from "../config";
import axios from 'axios';
import { Plus, Trash2, Edit, Users, Search, X } from 'lucide-react';

const FacultyManager = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    department: '',
    blockName: '',
    floorLevel: '',
    cabinNumber: '',
    staffroomNumber: '',
    timings: '',
  });

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/faculty`);
      setFaculty(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching faculty:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFaculty) {
        await axios.put(`${config.API_BASE_URL}/faculty/${editingFaculty._id}`, formData);
      } else {
        await axios.post(`${config.API_BASE_URL}/faculty`, formData);
      }
      fetchFaculty();
      resetForm();
    } catch (error) {
      console.error('Error saving faculty:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this faculty member?')) {
      try {
        await axios.delete(`${config.API_BASE_URL}/faculty/${id}`);
        fetchFaculty();
      } catch (error) {
        console.error('Error deleting faculty:', error);
      }
    }
  };

  const handleEdit = (fac) => {
    setEditingFaculty(fac);
    setFormData({
      fullName: fac.fullName,
      department: fac.department,
      blockName: fac.blockName || '',
      floorLevel: fac.floorLevel || '',
      cabinNumber: fac.cabinNumber || '',
      staffroomNumber: fac.staffroomNumber || '',
      timings: fac.timings,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      department: '',
      blockName: '',
      floorLevel: '',
      cabinNumber: '',
      staffroomNumber: '',
      timings: '',
    });
    setEditingFaculty(null);
    setShowForm(false);
  };

  const filteredFaculty = faculty.filter(fac => 
    (fac.fullName && fac.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (fac.department && fac.department.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Faculty Directory</h1>
          <p className="text-slate-500 mt-2 text-lg">Manage staff contacts and automated spatial mapping.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg ${
            showForm 
            ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-slate-200/50' 
            : 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:shadow-purple-500/30 hover:-translate-y-0.5'
          }`}
        >
          {showForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Add Faculty</>}
        </button>
      </div>

      {/* Form Overlay */}
      {showForm && (
        <div className="glass-card rounded-3xl p-8 mb-8 border border-white shadow-xl shadow-slate-200/50 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              {editingFaculty ? <Edit size={24} /> : <Plus size={24} />}
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              {editingFaculty ? 'Edit Faculty Details' : 'Register New Faculty'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700 ml-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-5 py-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none font-medium text-slate-700"
                placeholder="e.g., Dr. John Doe"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700 ml-1">Department</label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-5 py-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none font-medium text-slate-700"
                placeholder="e.g., Computer Science"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700 ml-1">Block Name (Auto-Maps to GPS)</label>
              <select
                required
                value={formData.blockName}
                onChange={(e) => setFormData({ ...formData, blockName: e.target.value })}
                className="w-full px-5 py-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none font-medium text-slate-700"
              >
                <option value="" disabled>Select Block</option>
                <option value="Block 1">Block 1</option>
                <option value="Block 2">Block 2</option>
                <option value="Block 3">Block 3</option>
                <option value="Block 4">Block 4</option>
                <option value="Block 5">Block 5</option>
                <option value="Block 6">Block 6</option>
                <option value="Devadan Hall">Devadan Hall</option>
                <option value="Architecture Block">Architecture Block</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700 ml-1">Floor Level</label>
              <select
                required
                value={formData.floorLevel}
                onChange={(e) => setFormData({ ...formData, floorLevel: e.target.value })}
                className="w-full px-5 py-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none font-medium text-slate-700"
              >
                <option value="" disabled>Select Floor</option>
                <option value="Ground Floor">Ground Floor</option>
                <option value="1st Floor">1st Floor</option>
                <option value="2nd Floor">2nd Floor</option>
                <option value="3rd Floor">3rd Floor</option>
                <option value="4th Floor">4th Floor</option>
                <option value="5th Floor">5th Floor</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700 ml-1">Cabin Number (Optional)</label>
              <input
                type="text"
                value={formData.cabinNumber}
                onChange={(e) => setFormData({ ...formData, cabinNumber: e.target.value })}
                className="w-full px-5 py-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none font-medium text-slate-700"
                placeholder="e.g., 204"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700 ml-1">Staffroom Number (Optional)</label>
              <input
                type="text"
                value={formData.staffroomNumber}
                onChange={(e) => setFormData({ ...formData, staffroomNumber: e.target.value })}
                className="w-full px-5 py-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none font-medium text-slate-700"
                placeholder="e.g., Staffroom A"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">Timings & Availability</label>
              <input
                type="text"
                required
                value={formData.timings}
                onChange={(e) => setFormData({ ...formData, timings: e.target.value })}
                className="w-full px-5 py-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none font-medium text-slate-700"
                placeholder="e.g., Mon-Fri, 9 AM - 5 PM"
              />
            </div>
            
            <div className="md:col-span-2 pt-4">
              <button
                type="submit"
                className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/30 hover:-translate-y-0.5 hover:shadow-purple-500/40 transition-all duration-300"
              >
                {editingFaculty ? 'Save Changes' : 'Register Faculty Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Content Area */}
      <div className="glass-card rounded-3xl overflow-hidden border border-white shadow-xl shadow-slate-200/40">
        
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100/60 bg-white/40 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search faculty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <div className="text-sm font-semibold text-slate-500 bg-white/80 px-4 py-2 rounded-lg border border-slate-100">
            {filteredFaculty.length} members found
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-xs uppercase tracking-wider font-bold text-slate-500 border-b border-slate-200/80">
                <th className="px-6 py-4">Faculty Member</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Schedule</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {filteredFaculty.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="text-slate-300" size={32} />
                    </div>
                    <p className="text-lg font-bold text-slate-700 mb-1">No faculty members found</p>
                    <p className="text-slate-400">Try adjusting your search or add a new faculty member.</p>
                  </td>
                </tr>
              ) : (
                filteredFaculty.map((fac) => (
                  <tr key={fac._id} className="hover:bg-purple-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-fuchsia-100 border border-purple-200 text-purple-700 font-bold flex items-center justify-center">
                          {fac.fullName ? fac.fullName.charAt(0) : 'F'}
                        </div>
                        <p className="font-bold text-slate-800 text-base">{fac.fullName || 'Unknown'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold tracking-wide">
                        {fac.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 text-sm">
                      <div className="flex flex-col">
                        <span className="font-bold text-purple-700">{fac.blockName} | {fac.floorLevel}</span>
                        {fac.cabinNumber && <span>Cabin: {fac.cabinNumber}</span>}
                        {fac.staffroomNumber && <span>Staffroom: {fac.staffroomNumber}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      {fac.timings}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(fac)}
                          className="p-2.5 text-purple-600 bg-white border border-slate-200 hover:border-purple-200 hover:bg-purple-50 rounded-xl transition-all shadow-sm"
                          title="Edit"
                        >
                          <Edit size={16} strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => handleDelete(fac._id)}
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

export default FacultyManager;
