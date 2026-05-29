import React, { useState, useEffect } from 'react';
import config from "../config";
import axios from 'axios';
import { Compass, Plus, Trash2, CheckCircle2, AlertCircle, Loader2, Navigation, MapPin } from 'lucide-react';

const RouteManager = () => {
  const [places, setPlaces] = useState([]);
  const [selectedDest, setSelectedDest] = useState('');
  const [waypoints, setWaypoints] = useState([
    { latitude: '', longitude: '', turnType: 'STRAIGHT', landmarkName: '', customInstruction: '' }
  ]);
  const [status, setStatus] = useState({ type: 'idle' });
  const [fetchingPlaces, setFetchingPlaces] = useState(true);

  // Fetch campus places for the destination selector dropdown
  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const res = await axios.get(`${config.API_BASE_URL}/places`);
        if (res.data && res.data.data) {
          setPlaces(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching places:', err);
      } finally {
        setFetchingPlaces(false);
      }
    };
    fetchPlaces();
  }, []);

  const addWaypoint = () => {
    setWaypoints([
      ...waypoints,
      { latitude: '', longitude: '', turnType: 'STRAIGHT', landmarkName: '', customInstruction: '' }
    ]);
  };

  const removeWaypoint = (index) => {
    if (waypoints.length === 1) {
      setWaypoints([{ latitude: '', longitude: '', turnType: 'STRAIGHT', landmarkName: '', customInstruction: '' }]);
      return;
    }
    const updated = waypoints.filter((_, i) => i !== index);
    setWaypoints(updated);
  };

  const handleWaypointChange = (index, field, value) => {
    const updated = waypoints.map((wp, i) => {
      if (i === index) {
        return { ...wp, [field]: value };
      }
      return wp;
    });
    setWaypoints(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDest) {
      setStatus({ type: 'error', message: 'Please select a destination campus location.' });
      return;
    }

    // Validate and parse waypoints
    const validatedWaypoints = [];
    for (let i = 0; i < waypoints.length; i++) {
      const wp = waypoints[i];
      const lat = parseFloat(wp.latitude);
      const lng = parseFloat(wp.longitude);

      if (isNaN(lat) || isNaN(lng)) {
        setStatus({
          type: 'error',
          message: `Waypoint #${i + 1} contains invalid coordinate numbers.`
        });
        return;
      }

      if (!wp.landmarkName || !wp.customInstruction) {
        setStatus({
          type: 'error',
          message: `Waypoint #${i + 1} is missing a landmark name or guidance instruction.`
        });
        return;
      }

      validatedWaypoints.push({
        latitude: lat,
        longitude: lng,
        turnType: wp.turnType,
        landmarkName: wp.landmarkName.trim(),
        customInstruction: wp.customInstruction.trim()
      });
    }

    setStatus({ type: 'loading' });

    try {
      await axios.post(`${config.API_BASE_URL}/navigation/routes`, {
        endPlaceId: selectedDest,
        waypoints: validatedWaypoints
      });

      setStatus({ type: 'success', message: 'Campus Pathway Successfully Registered!' });
      
      // Reset form
      setSelectedDest('');
      setWaypoints([
        { latitude: '', longitude: '', turnType: 'STRAIGHT', landmarkName: '', customInstruction: '' }
      ]);

      setTimeout(() => {
        setStatus({ type: 'idle' });
      }, 3000);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Failed to save pathway route'
      });
    }
  };

  return (
    <div className="flex justify-center items-start pt-6 h-full pb-16">
      <div className="max-w-3xl w-full glass-card rounded-3xl p-10 animate-fade-in-up border border-white/60 shadow-xl">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-emerald-100 to-teal-50 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
            <Compass className="h-7 w-7 text-emerald-600 animate-spin-slow" />
          </div>
          <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
            Create Campus Pathway
          </h2>
          <p className="mt-3 text-slate-500 font-medium">
            Define a high-accuracy coordinate walkway matrix. The mobile app will dynamically snap users onto this sequence.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Destination Selector */}
          <div>
            <label htmlFor="destination" className="block text-sm font-semibold text-slate-700 ml-1 mb-2">
              Select Campus Destination
            </label>
            {fetchingPlaces ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 p-3 bg-white/55 rounded-2xl border border-slate-100">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                Loading campus locations...
              </div>
            ) : (
              <select
                id="destination"
                value={selectedDest}
                onChange={(e) => setSelectedDest(e.target.value)}
                className="block w-full rounded-2xl border-0 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-white/80 px-4 py-3.5 text-slate-900 font-medium transition-all"
              >
                <option value="">-- Choose Target Building / Location --</option>
                {places.map((place) => (
                  <option key={place._id || place.id} value={place._id || place.id}>
                    {place.name} ({place.category})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Sequential Waypoints Section */}
          <div>
            <div className="flex justify-between items-center mb-4 ml-1">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <MapPin className="text-red-500 h-5 w-5" /> Pathway Waypoints Queue
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Order of walking nodes from start to arrival point</p>
              </div>
              <button
                type="button"
                onClick={addWaypoint}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <Plus size={16} /> Add Walking Node
              </button>
            </div>

            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {waypoints.map((wp, index) => (
                <div
                  key={index}
                  className="p-5 bg-white/60 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-slate-300 transition-colors"
                >
                  <div className="absolute top-4 left-4 w-7 h-7 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                    {index + 1}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeWaypoint(index)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Remove Waypoint"
                  >
                    <Trash2 size={18} />
                  </button>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Coordinates */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Latitude</label>
                      <input
                        type="text"
                        value={wp.latitude}
                        onChange={(e) => handleWaypointChange(index, 'latitude', e.target.value)}
                        placeholder="e.g. 12.864812"
                        className="block w-full rounded-xl border-0 shadow-inner ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-blue-500 bg-white/80 px-3.5 py-2.5 text-sm text-slate-900 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Longitude</label>
                      <input
                        type="text"
                        value={wp.longitude}
                        onChange={(e) => handleWaypointChange(index, 'longitude', e.target.value)}
                        placeholder="e.g. 77.435520"
                        className="block w-full rounded-xl border-0 shadow-inner ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-blue-500 bg-white/80 px-3.5 py-2.5 text-sm text-slate-900 transition-all"
                      />
                    </div>

                    {/* Turn Type Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Guidance Turn Direction</label>
                      <select
                        value={wp.turnType}
                        onChange={(e) => handleWaypointChange(index, 'turnType', e.target.value)}
                        className="block w-full rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 bg-white/80 px-3.5 py-2.5 text-sm text-slate-900 transition-all"
                      >
                        <option value="STRAIGHT">🚶 STRAIGHT (Go Straight)</option>
                        <option value="LEFT">👈 LEFT (Turn Left)</option>
                        <option value="RIGHT">👉 RIGHT (Turn Right)</option>
                        <option value="ARRIVED">🎉 ARRIVED (End of Pathway)</option>
                      </select>
                    </div>

                    {/* Nearby Landmark */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Nearby Landmark Reference</label>
                      <input
                        type="text"
                        value={wp.landmarkName}
                        onChange={(e) => handleWaypointChange(index, 'landmarkName', e.target.value)}
                        placeholder="e.g. Central Library Block Entrance"
                        className="block w-full rounded-xl border-0 shadow-inner ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-blue-500 bg-white/80 px-3.5 py-2.5 text-sm text-slate-900 transition-all"
                      />
                    </div>

                    {/* Custom Text Guidance */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Real-time Navigation Message</label>
                      <input
                        type="text"
                        value={wp.customInstruction}
                        onChange={(e) => handleWaypointChange(index, 'customInstruction', e.target.value)}
                        placeholder="e.g. Continue straight for 15 meters passing the cafeteria on your left."
                        className="block w-full rounded-xl border-0 shadow-inner ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-blue-500 bg-white/80 px-3.5 py-2.5 text-sm text-slate-900 transition-all"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Modal Notification */}
          {status.type !== 'idle' && (
            <div className={`rounded-2xl p-4 flex items-center shadow-sm animate-fade-in-up ${
              status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200/50' :
              status.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200/50' :
              'bg-blue-50 text-blue-800 border border-blue-200/50'
            }`}>
              {status.type === 'success' && <CheckCircle2 className="h-5 w-5 mr-3 flex-shrink-0" />}
              {status.type === 'error' && <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />}
              {status.type === 'loading' && <Loader2 className="h-5 w-5 mr-3 flex-shrink-0 animate-spin" />}
              <span className="text-sm font-semibold">{status.message || 'Saving pathway...'}</span>
            </div>
          )}

          {/* Submission Button */}
          <button
            type="submit"
            disabled={status.type === 'loading'}
            className="w-full flex justify-center items-center py-4 px-4 rounded-2xl shadow-lg shadow-blue-500/25 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-all duration-300 transform active:scale-[0.98]"
          >
            {status.type === 'loading' ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Registering Pathway...
              </>
            ) : (
              'Save Pathway Route to database'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RouteManager;
