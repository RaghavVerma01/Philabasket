import React from 'react'
import { assets } from '../assets/assets'
import { Link } from 'react-router-dom'

import { 
  ShieldCheck, Lock, Globe, ArrowUpRight, MapPin, Phone, Mail, 
  Instagram, Facebook, Youtube, Twitter 
} from 'lucide-react'

const Footer = () => {
  // Social media protocol data
  const socialProtocols = [
    { label: 'Instagram', icon: <Instagram size={14} />, path: 'https://instagram.com/philabasket' },
    { label: 'Facebook', icon: <Facebook size={14} />, path: 'https://facebook.com/philabasket' },
    { label: 'Youtube', icon: <Youtube size={14} />, path: 'https://youtube.com/@philabasket' },
    { label: 'Twitter', icon: <Twitter size={14} />, path: 'https://twitter.com/philabasket' },
  ];


  return (
    <footer className="relative bg-white pt-32 pb-16 px-6 md:px-16 lg:px-24 overflow-hidden border-t border-black/[0.03] select-none font-sans">
      
      {/* --- CURVED ACCENT (Bottom Right) --- */}
      <div className="absolute -right-[15vw] -bottom-[2vh] h-[60vh] w-[50vw] bg-[#BC002D] rounded-tl-[600px] pointer-events-none opacity-100 transition-all duration-700"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-24">
          
          {/* Brand Identity */}
          <div className="flex flex-col gap-8">
            <div className='flex items-center gap-2 md:gap-3 group cursor-pointer'>
                <img 
                  src={assets.logo} 
                  className='w-8 md:w-10 group-hover:rotate-[360deg] transition-transform duration-1000 object-contain' 
                  alt="Logo" 
                />
                <img 
                  src={assets.logo5}
                  className='w-24 md:w-28 h-auto object-contain' 
                  alt="Text Logo" 
                />
            </div>
            
            <p className="text-gray-500 text-[13px] leading-relaxed font-medium max-w-xs">
              Sovereign registry for international philatelic specimens. Cataloging history through verified global archives.
            </p>
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Social connectivity</p>
                    <Globe size={10} className="text-gray-300" />
                </div>
                <div className="flex gap-4">
                  {socialProtocols.map((social, sIdx) => (
                    <a 
                      key={sIdx} 
                      href={social.path} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#BC002D] transition-colors duration-300"
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
            </div>

            {/* Payment Protocols */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <p className="text-[11px] font-semibold text-gray-400">Settlement protocols</p>
                    <Lock size={10} className="text-gray-300" />
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-4 items-center opacity-100 transition-all duration-500">
    {/* Visa */}
    
    {/* Mastercard - Fixed missing path */}
    <img 
        src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" 
        className="h-4 w-auto" 
        alt="Mastercard" 
    />
    
    {/* Razorpay */}
    <img 
        src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" 
        className="h-2.5 w-auto" 
        alt="Razorpay" 
    />
    
    {/* Stripe */}
    <img 
        src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" 
        className="h-3.5 w-auto" 
        alt="Stripe" 
    />
</div>
            </div>
          </div>

          {/* Navigation Columns */}
          {[
  {
    title: 'Registry index',
    links: [
      { label: 'Membership ', path: '/membership' },
      
      { label: 'Referral', path: '/referral' },
      { label: 'Rewards', path: '/rewards' },
      { label: 'Archive blogs', path: '/blogs' },
      { label: 'Catalogue', path: '/collection' },

      
      // { label: 'About the Archive', path: '/about' },
    ]
  },
  {
    title: "Our Policies",
    links: [
      { label: 'Shipping policy', path: '/shipping' },
      { label: 'Terms and condition', path: '/terms' },
      { label: 'Privacy Policy', path: '/privacy' }, // Fixed safe path
      { label: 'Frequently asked questions', path: '/faq' },
    ]
  },
  {
    title: "Info",
    links: [
      { label: "New Delhi, 110092 India", icon: <MapPin size={12} /> },
      { label: "+91 9999167799", path: "tel:+919999167799", icon: <Phone size={12} /> },
      { label: "admin@philabasket.com", path: "mailto:admin@philabasket.com", icon: <Mail size={12} /> }
    ]
  }
].map((column, idx) => (
  <div key={idx} className="lg:ml-auto">
    <h4 className="text-[#BC002D] text-[11px] font-black uppercase tracking-[0.2em] mb-8">
      {column.title}
    </h4>
    <ul className="flex flex-col gap-3">
      {column.links.map((link, lIdx) => (
        <li key={lIdx}>
          <Link
            to={link.path || "#"}
            onClick={() => window.scrollTo(0, 0)}
            className="text-gray-900  text-[13px] font-medium transition-all duration-300 flex items-center gap-2 group w-fit"
          >
            {/* Show icon for contact info, otherwise show arrow on hover for registry links */}
            {link.icon && <span className="text-gray-400">{link.icon}</span>}
            {link.label}
            {link.path && !link.icon && (
              <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-all translate-y-0.5" />
            )}
          </Link>
        </li>
      ))}
    </ul>
  </div>
))}
        </div>

        {/* Separator */}
        <div className="w-full h-[1px] bg-black/[0.05] mt-24 mb-10"></div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-gray-400 text-[11px] font-medium">
              © 2026 PhilaBasket Sovereign. All rights reserved.
            </p>
          </div>
          
        </div>
      </div>
    </footer>
  )
}

export default Footer;