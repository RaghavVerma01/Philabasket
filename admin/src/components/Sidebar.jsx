import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { assets } from '../assets/assets'
import {
  LayoutDashboard, PlusCircle, ClipboardList, Package, FileEdit,
  LibraryBig, MessageSquare, Upload, ImageIcon, Layers, Mail,
  Newspaper, ChevronLeft, ChevronRight, Users, Ticket, Settings2, Monitor
} from 'lucide-react'


const navSections = [

  {
  
  label: 'Command Center',
  
  items: [
  
  { to: '/dashboard', icon: LayoutDashboard, label: 'Performance' },
  
  { to: '/orders', icon: Package, label: 'Order Registry' },
  
  { to: '/export', icon: Upload, label: 'Export Desk' },
  
  { to: '/feedback', icon: MessageSquare, label: 'Client Feedback' },
  
  { to: '/users', icon: Users, label: 'User Directory' },
  
  ]
  
  },
  
  {
  
  label: 'Inventory Protocol',
  
  items: [
  
  { to: '/list', icon: ClipboardList, label: 'Inventory' },
  
  { to: '/add', icon: PlusCircle, label: 'Add New Item' },
  
  { to: '/category', icon: Layers, label: 'Category Map' },
  
  { to: '/coupon', icon: Ticket, label: 'Coupons' },
  
  ]
  
  },
  
  {
  
  label: 'Interface Control',
  
  items: [
  
  { to: '/header', icon: Settings2, label: 'Header Manager' },
  
  { to: '/banner', icon: Monitor, label: ' Banners Image' },
  
  { to: '/media', icon: ImageIcon, label: 'Media Library' },
  
  ]
  
  },
  
  {
  
  label: 'Communications',
  
  items: [
  
  { to: '/blog', icon: FileEdit, label: 'Write Blog' },
  
  { to: '/list-blog', icon: LibraryBig, label: 'Blog Archive' },
  
  { to: '/mail', icon: Mail, label: 'Direct Mail' },
  
  { to: '/news', icon: Newspaper, label: 'Newsletter' },
  
  ]
  
  }
  
  ]// ... navSections array remains the same ...

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false)

  // Function to force scroll to top on navigation
  const handleNavigation = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // Use 'auto' for an instant jump
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&display=swap');
        .sidebar-root { font-family: 'DM Sans', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .nav-link-item .tooltip {
          position: absolute;
          left: 58px;
          background: #1a1a1a;
          color: #fff;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 6px 12px;
          border-radius: 6px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: all 0.2s;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .nav-link-item:hover .tooltip { opacity: 1; left: 68px; }
      `}</style>

      <div
        className={`sidebar-root relative flex flex-col min-h-screen bg-white border-r border-gray-100 transition-all duration-500 ease-in-out ${collapsed ? 'w-[80px]' : 'w-[240px]'}`}
      >
        {/* Branding Area */}
        <div className={`flex items-center gap-3 px-6 py-8 mb-4 ${collapsed ? 'justify-center px-0' : ''}`}>
          <img 
            src={assets.logo} 
            className={`transition-all duration-500 ${collapsed ? 'w-8' : 'w-10'}`} 
            alt="Logo" 
          />
          {!collapsed && (
            <div className='animate-in fade-in slide-in-from-left-2 duration-500'>
              <p className='text-[13px] font-black text-gray-900 uppercase tracking-tighter leading-none'>PhilaBasket</p>
              <p className='text-[10px] font-bold text-[#BC002D] uppercase tracking-widest mt-1'>Registry</p>
            </div>
          )}
        </div>

        {/* Navigation Registry */}
        <nav className='flex-1 overflow-y-auto no-scrollbar px-4 space-y-8'>
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed ? (
                <p className='text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-3 mb-4 opacity-50'>
                  {section.label}
                </p>
              ) : (
                <div className='w-8 h-px bg-gray-100 mx-auto mb-6' />
              )}

              <div className='space-y-1'>
                {section.items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={handleNavigation} // Trigger scroll to top on click
                    className={({ isActive }) =>
                      `nav-link-item flex items-center gap-4 px-3 py-3 rounded-2xl transition-all duration-300 group
                      ${collapsed ? 'justify-center' : ''}
                      ${isActive
                        ? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
                        : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className={`flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-[#BC002D]' : 'text-inherit'}`}>
                          <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        {!collapsed && (
                          <span className={`text-[11px] font-bold uppercase tracking-widest transition-all ${isActive ? 'translate-x-1' : ''}`}>
                            {label}
                          </span>
                        )}
                        {collapsed && <span className='tooltip'>{label}</span>}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer / Toggle */}
        <div className='p-6 mt-auto'>
            <button
                onClick={() => setCollapsed(!collapsed)}
                className='w-full h-12 rounded-2xl bg-gray-50 hover:bg-gray-900 hover:text-white flex items-center justify-center transition-all duration-300 group'
            >
                {collapsed ? (
                    <ChevronRight size={16} className='group-hover:translate-x-0.5 transition-transform' />
                ) : (
                    <div className='flex items-center gap-3 px-4 w-full'>
                        <ChevronLeft size={16} className='group-hover:-translate-x-0.5 transition-transform' />
                        <span className='text-[10px] font-black uppercase tracking-widest'>Minimize</span>
                    </div>
                )}
            </button>
        </div>
      </div>
    </>
  )
}

export default Sidebar