import React, { useState } from 'react';
import config from "../config";
import axios from 'axios';
import { MapPin, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const LocationManager = () => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    coordinates: '',
    entranceCoordinates: '',
    requiresIndoorNav: false,
    floorLevel: '',
    roomNumber: '',
    indoorDirections: ''
  });
  const [status, setStatus] = useState({ type: 'idle' });

  const categories = ['Block', 'Canteen', 'Hostel', 'Gate', 'Facility'];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.coordinates) {
      setStatus({ type: 'error', message: 'Please fill in all fields' });
      return;
    }

    const parts = formData.coordinates.split(',');
    if (parts.length != 2) {
      setStatus({ type: 'error', message: 'Please enter coordinates as Lat, Lng (e.g. 12.864, 77.435)' });
      return;
    }

    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());

    if (isNaN(lat) || isNaN(lng)) {
      setStatus({ type: 'error', message: 'Latitude and Longitude must be valid numbers' });
      return;
    }

    setStatus({ type: 'loading' });

    let entranceLat = undefined;
    let entranceLng = undefined;

    if (formData.requiresIndoorNav && formData.entranceCoordinates) {
      const entParts = formData.entranceCoordinates.split(',');
      if (entParts.length === 2) {
        entranceLat = parseFloat(entParts[0].trim());
        entranceLng = parseFloat(entParts[1].trim());
      }
    }

    try {
      await axios.post(`${config.API_BASE_URL}/places`, {
        name: formData.name,
        category: formData.category,
        latitude: lat,
        longitude: lng,
        requiresIndoorNav: formData.requiresIndoorNav,
        entranceLatitude: entranceLat,
        entranceLongitude: entranceLng,
        floorLevel: formData.floorLevel,
        roomNumber: formData.roomNumber,
        indoorDirections: formData.indoorDirections
      });

      setStatus({ type: 'success', message: 'Location Live on Campus Map!' });
      setFormData({ name: '', category: '', coordinates: '', entranceCoordinates: '', requiresIndoorNav: false, floorLevel: '', roomNumber: '', indoorDirections: '' });

      setTimeout(() => {
        setStatus({ type: 'idle' });
      }, 3000);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Failed to save location'
      });
    }
  };

  return (
    <div className="flex justify-center items-start pt-10 h-full">
      <div className="max-w-xl w-full glass-card rounded-3xl p-10 animate-fade-in-up border border-white/60">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
            <MapPin className="h-7 w-7 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">Add Campus Location</h2>
          <p className="mt-3 text-slate-500 font-medium">
            Drop a pin on Google Maps and paste the coordinates below to update the mobile app instantly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-slate-700 ml-1 mb-1.5">Place Name</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="block w-full rounded-2xl border-0 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-white/80 px-4 py-3.5 text-slate-900 placeholder:text-slate-400 transition-all"
              placeholder="e.g. Devadan Hall"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-slate-700 ml-1 mb-1.5">Category</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="block w-full rounded-2xl border-0 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-white/80 px-4 py-3.5 text-slate-900 transition-all"
            >
              <option value="" disabled>Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="coordinates" className="block text-sm font-semibold text-slate-700 ml-1 mb-1.5">Coordinates (Lat, Lng)</label>
            <input
              type="text"
              id="coordinates"
              value={formData.coordinates}
              onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
              className="block w-full rounded-2xl border-0 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-white/80 px-4 py-3.5 text-slate-900 placeholder:text-slate-400 transition-all"
              placeholder="e.g. 12.864812, 77.435520"
            />
          </div>

          <div className="flex items-center space-x-3 p-4 bg-white/50 rounded-2xl border border-slate-200">
            <input
              type="checkbox"
              id="requiresIndoorNav"
              checked={formData.requiresIndoorNav}
              onChange={(e) => setFormData({ ...formData, requiresIndoorNav: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="requiresIndoorNav" className="text-sm font-semibold text-slate-700 cursor-pointer">
              Enable Indoor Navigation Data
            </label>
          </div>

          {formData.requiresIndoorNav && (
            <div className="space-y-4 p-4 bg-white/40 rounded-2xl border border-slate-200 animate-fade-in-up">
              <div>
                <label htmlFor="entranceCoordinates" className="block text-sm font-semibold text-slate-700 ml-1 mb-1.5">Entrance Coordinates (Lat, Lng) - Geofence Trigger</label>
                <input
                  type="text"
                  id="entranceCoordinates"
                  value={formData.entranceCoordinates}
                  onChange={(e) => setFormData({ ...formData, entranceCoordinates: e.target.value })}
                  className="block w-full rounded-2xl border-0 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-white/80 px-4 py-3.5 text-slate-900 placeholder:text-slate-400 transition-all"
                  placeholder="e.g. 12.864700, 77.435600"
                />
              </div>
              <div>
                <label htmlFor="floorLevel" className="block text-sm font-semibold text-slate-700 ml-1 mb-1.5 flex items-center">
                  Floor
                </label>
                <div className="relative">
                  <select
                    id="floorLevel"
                    value={formData.floorLevel}
                    onChange={(e) => setFormData({ ...formData, floorLevel: e.target.value })}
                    className="block w-full rounded-2xl border-0 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-white/80 px-4 py-3.5 text-slate-900 appearance-none transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select floor</option>
                    <option value="0">Ground Floor</option>
                    <option value="1">1st Floor </option>
                    <option value="2">2nd Floor </option>
                    <option value="3">3rd Floor </option>
                    <option value="4">4th Floor </option>
                    <option value="5">5th Floor </option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="roomNumber" className="block text-sm font-semibold text-slate-700 ml-1 mb-1.5">Room Number</label>
                <input
                  type="text"
                  id="roomNumber"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  className="block w-full rounded-2xl border-0 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-white/80 px-4 py-3.5 text-slate-900 placeholder:text-slate-400 transition-all"
                  placeholder="e.g. Room 304"
                />
              </div>
              <div>
                <label htmlFor="indoorDirections" className="block text-sm font-semibold text-slate-700 ml-1 mb-1.5">Step-by-Step Indoor Directions</label>
                <textarea
                  id="indoorDirections"
                  rows="3"
                  value={formData.indoorDirections}
                  onChange={(e) => setFormData({ ...formData, indoorDirections: e.target.value })}
                  className="block w-full rounded-2xl border-0 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-white/80 px-4 py-3.5 text-slate-900 placeholder:text-slate-400 transition-all resize-none"
                  placeholder="e.g. Take the main elevator to floor 3, turn left."
                />
              </div>
            </div>
          )}

          {status.type !== 'idle' && (
            <div className={`rounded-2xl p-4 flex items-center shadow-sm animate-fade-in-up ${status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200/50' :
                status.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200/50' :
                  'bg-blue-50 text-blue-800 border border-blue-200/50'
              }`}>
              {status.type === 'success' && <CheckCircle2 className="h-5 w-5 mr-3 flex-shrink-0" />}
              {status.type === 'error' && <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />}
              {status.type === 'loading' && <Loader2 className="h-5 w-5 mr-3 flex-shrink-0 animate-spin" />}
              <span className="text-sm font-medium">{status.message || 'Saving...'}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={status.type === 'loading'}
            className="w-full flex justify-center items-center py-4 px-4 rounded-2xl shadow-lg shadow-blue-500/30 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-all duration-300 transform active:scale-[0.98]"
          >
            {status.type === 'loading' ? 'Saving to Database...' : 'Save Location to CMS'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LocationManager;
