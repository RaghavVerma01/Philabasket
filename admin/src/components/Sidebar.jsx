import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  Package,
  FileEdit,
  LibraryBig,
  MessageSquare,
  Upload,
  ImageIcon,
  Layers,
  Mail,
  Newspaper,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const navSections = [
  {
    label: 'Operations',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/orders', icon: Package, label: 'Orders' },
      { to: '/feedback', icon: MessageSquare, label: 'Feedback' },
      { to: '/export', icon: Upload, label: 'Export Desk' },
      { to: '/users', icon: Upload, label: 'User Profile' },

    ]
  },
  {
    label: 'Inventory',
    items: [
      { to: '/media', icon: ImageIcon, label: 'Media' },
      { to: '/add', icon: PlusCircle, label: 'Add Product' },
      { to: '/category', icon: Layers, label: 'Categories' },
      { to: '/list', icon: ClipboardList, label: 'All Products' },
      { to: '/coupon', icon: ClipboardList, label: 'Generate Coupon' },

    ]
  },
  {
    label: 'Content',
    items: [
      { to: '/blog', icon: FileEdit, label: 'Write Blog' },
      { to: '/list-blog', icon: LibraryBig, label: 'All Blogs' },
      { to: '/mail', icon: Mail, label: 'Bulk Mail' },
      { to: '/news', icon: Newspaper, label: 'Newsletter' },
    ]
  }
]

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&display=swap');
        .sidebar-root { font-family: 'DM Sans', sans-serif; }
        .nav-link-item { position: relative; }
        .nav-link-item .tooltip {
          position: absolute;
          left: calc(100% + 12px);
          top: 50%;
          transform: translateY(-50%);
          background: #111;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 5px 10px;
          border-radius: 8px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s;
          z-index: 50;
        }
        .nav-link-item:hover .tooltip { opacity: 1; }
      `}</style>

      <div
        className={`sidebar-root relative flex flex-col min-h-screen bg-white border-r border-gray-100 transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[210px]'}`}
      >
        {/* Logo Area */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-100 ${collapsed ? 'justify-center' : ''}`}>
          <div className='w-7 h-7 bg-[#BC002D] rounded-lg flex-shrink-0 flex items-center justify-center'>
            <span className='text-white font-black text-xs'>S</span>
          </div>
          {!collapsed && (
            <div>
              <p className='text-[11px] font-black text-gray-900 uppercase tracking-widest leading-none'>Sovereign</p>
              <p className='text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5'>Admin</p>
            </div>
          )}
        </div>

        {/* Nav Sections */}
        <nav className='flex-1 overflow-y-auto py-4 px-2 space-y-6'>
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className='text-[9px] font-black text-gray-300 uppercase tracking-[0.25em] px-3 mb-2'>
                  {section.label}
                </p>
              )}
              {collapsed && <div className='w-6 h-px bg-gray-100 mx-auto mb-2' />}

              <div className='space-y-0.5'>
                {section.items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `nav-link-item flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                      ${collapsed ? 'justify-center' : ''}
                      ${isActive
                        ? 'bg-[#BC002D]/8 text-[#BC002D]'
                        : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-all ${isActive ? 'bg-[#BC002D] text-white shadow-sm shadow-[#BC002D]/30' : 'text-inherit'}`}>
                          <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        {!collapsed && (
                          <span className={`text-[11px] font-bold uppercase tracking-wider transition-all ${isActive ? 'text-[#BC002D]' : ''}`}>
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

        {/* Collapse Toggle */}
        <div className='border-t border-gray-100 p-3 flex justify-end'>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className='w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-700'
          >
            {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </div>
      </div>
    </>
  )
}

export default Sidebar