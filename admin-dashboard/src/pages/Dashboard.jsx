import React, { useEffect, useState } from 'react';
import config from "../config";
import axios from 'axios';
import { LayoutDashboard, Utensils, Users, MapPin, MessageSquare, Activity, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPlaces: 12,
    totalMenuItems: 0,
    totalFaculty: 0,
    totalRoutes: 5,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [canteenRes, facultyRes] = await Promise.all([
          axios.get(`${config.API_BASE_URL}/canteen`).catch(() => ({ data: { count: 0 } })),
          axios.get(`${config.API_BASE_URL}/faculty`).catch(() => ({ data: { count: 0 } })),
        ]);

        setStats((prev) => ({
          ...prev,
          totalMenuItems: canteenRes.data.count || 0,
          totalFaculty: facultyRes.data.count || 0,
        }));
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      icon: MapPin,
      label: 'Campus Locations',
      value: stats.totalPlaces,
      color: 'from-blue-500 to-cyan-400',
      shadow: 'shadow-blue-500/20',
      delay: 'stagger-1'
    },
    {
      icon: Utensils,
      label: 'Menu Items',
      value: stats.totalMenuItems,
      color: 'from-emerald-500 to-teal-400',
      shadow: 'shadow-emerald-500/20',
      delay: 'stagger-2'
    },
    {
      icon: Users,
      label: 'Faculty Members',
      value: stats.totalFaculty,
      color: 'from-purple-500 to-fuchsia-400',
      shadow: 'shadow-purple-500/20',
      delay: 'stagger-3'
    },
    {
      icon: MessageSquare,
      label: 'Nav Routes',
      value: stats.totalRoutes,
      color: 'from-orange-500 to-amber-400',
      shadow: 'shadow-orange-500/20',
      delay: 'stagger-4'
    },
  ];

  return (
    <div className="pt-4 lg:pt-0 pb-12 max-w-7xl mx-auto">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">System Overview</h1>
          <p className="text-slate-500 mt-2 text-lg">Welcome back! Here's what's happening on campus today.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 text-sm font-medium text-slate-600">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          System Online
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`glass-card rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-2 hover:shadow-xl transition-all duration-300 animate-fade-in-up ${card.delay}`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 rounded-bl-full -z-10 transition-transform group-hover:scale-110 duration-500"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${card.color} shadow-lg ${card.shadow} text-white transform group-hover:rotate-6 transition-transform duration-300`}>
                  <Icon size={28} strokeWidth={2.5} />
                </div>
                <div className="bg-white/60 px-3 py-1 rounded-full text-xs font-semibold text-slate-500 shadow-sm border border-white/50">
                  Total
                </div>
              </div>
              
              <div>
                <p className="text-4xl font-black text-slate-800 tracking-tight mb-1">{card.value}</p>
                <h3 className="text-slate-500 font-medium">{card.label}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up stagger-4">
        
        {/* Quick Actions */}
        <div className="glass-card rounded-3xl p-8 lg:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Activity size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/canteen" className="group p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 hover:shadow-md hover:shadow-blue-200/50 hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-center mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <Utensils size={20} />
                </div>
                <ArrowRight size={20} className="text-blue-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Manage Menu</h3>
              <p className="text-sm text-slate-500 mt-1">Add or update canteen items</p>
            </Link>

            <Link to="/faculty" className="group p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-fuchsia-50 border border-purple-100/50 hover:shadow-md hover:shadow-purple-200/50 hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-center mb-2">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                  <Users size={20} />
                </div>
                <ArrowRight size={20} className="text-purple-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Faculty Directory</h3>
              <p className="text-sm text-slate-500 mt-1">Update staff contact details</p>
            </Link>
          </div>
        </div>

        {/* System Status */}
        <div className="glass-card rounded-3xl p-8 relative">
          <div className="flex items-center gap-3 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400 rounded-full blur-md opacity-60 animate-pulse"></div>
              <div className="relative p-2 bg-emerald-100 text-emerald-600 rounded-full">
                <Activity size={20} />
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Status Check</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div> API Server
                </span>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold tracking-wide uppercase">
                  Active
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-full rounded-full"></div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Database
                </span>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold tracking-wide uppercase">
                  Connected
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-full rounded-full"></div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Last Synced</p>
              <p className="text-slate-700 font-medium text-sm">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
