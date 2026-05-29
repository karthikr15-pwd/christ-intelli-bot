import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Utensils, Users, Menu, X, Sparkles, MapPin, Compass } from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Overview' },
    { path: '/canteen', icon: Utensils, label: 'Canteen' },
    { path: '/faculty', icon: Users, label: 'Directory' },
    { path: '/locations', icon: MapPin, label: 'Locations' },
    { path: '/routes', icon: Compass, label: 'Routes' },
    { path: '/campus-brain', icon: Sparkles, label: 'Campus Brain' },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white/80 backdrop-blur-md text-slate-800 shadow-lg shadow-slate-200/50 rounded-xl border border-white/50 hover:bg-white transition-all"
      >
        {isOpen ? <X size={22} className="text-blue-600" /> : <Menu size={22} className="text-blue-600" />}
      </button>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`fixed left-0 top-0 h-full z-40 transition-all duration-400 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-72 p-4`}
      >
        <div className="h-full w-full glass rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col relative overflow-hidden">
          
          {/* Decorative Glow */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-2xl -z-10 rounded-t-3xl"></div>

          <div className="p-8 pt-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/30 text-white">
                <Sparkles size={22} className="animate-pulse-slow" />
              </div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight">
                Intelli-Bot
              </h1>
            </div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-12">Admin Portal</p>
          </div>

          <nav className="flex-1 px-6 pt-4 space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Menu</p>
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`group flex items-center gap-4 px-4 py-3.5 rounded-2xl font-medium transition-all duration-300 ${
                        isActive
                          ? 'bg-white shadow-sm border border-slate-100 text-blue-600'
                          : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
                      }`}
                    >
                      <div className={`transition-transform duration-300 ${isActive ? 'scale-110 text-blue-600' : 'text-slate-400 group-hover:scale-110 group-hover:text-blue-500'}`}>
                        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                      </div>
                      <span className="tracking-wide">{item.label}</span>
                      
                      {isActive && (
                        <div className="ml-auto w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>


        </div>
      </aside>
    </>
  );
};

export default Sidebar;
