import React, { useEffect } from 'react';
import { ShieldCheck, Lock, EyeOff, Globe, Mail, FileText } from 'lucide-react';

const Legal = () => {
    // Ensure collector starts at the top of the document
    useEffect(() => { window.scrollTo(0, 0); }, []);

    const sections = [
        {
            title: "Information Collection",
            icon: <FileText size={20} className="text-[#BC002D]" />,
            content: "When you purchase a specimen from our store, we collect personal details such as your name, address, and email address. While browsing, we automatically receive your IP address to help us optimize your experience with our registry protocol."
        },
        {
            title: "Consent Protocol",
            icon: <ShieldCheck size={20} className="text-[#BC002D]" />,
            content: "By completing a transaction or arranging delivery, you consent to our collection of data for that specific reason only. You may withdraw consent for continued contact at any time by reaching out to Admin@philabasket.com."
        },
        {
            title: "Disclosure Policy",
            icon: <EyeOff size={20} className="text-[#BC002D]" />,
            content: "We do not sell or share your personal information with third-party firms. Disclosure only occurs if required by law or in the event of a violation of our Terms of Service."
        },
        {
            title: "Payment Security",
            icon: <Lock size={20} className="text-[#BC002D]" />,
            content: "Philabasket does not save any payment details. Transactions are encrypted using Secure Socket Layer (SSL) technology and follow strict PCI-DSS requirements to ensure industry-standard protection."
        }
    ];

    return (
        <div className='bg-[#FCF9F4] min-h-screen py-12 px-[6%] font-serif text-black'>
            {/* Header Section */}
            <div className='max-w-4xl mx-auto text-center mb-16'>
                <h2 className='text-3xl font-black uppercase tracking-[0.2em] mb-4'>Privacy <span className='text-[#BC002D]'>Protocol</span></h2>
                <div className='h-1 w-20 bg-[#BC002D] mx-auto mb-6'></div>
                <p className='text-xs text-gray-500 uppercase font-bold tracking-widest leading-relaxed'>
                    This policy outlines how we manage, protect, and archive your data within the Philabasket Registry.
                </p>
            </div>

            <div className='max-w-4xl mx-auto space-y-12'>
                {/* Add this inside your max-w-4xl mx-auto space-y-12 container */}
<div className='bg-gray-50 p-8 border border-gray-100 rounded-sm italic'>
    <h3 className='font-black uppercase text-[10px] tracking-widest mb-4 text-gray-400'>
        Policy Modifications
    </h3>
    <p className='text-[12px] text-gray-500 leading-relaxed font-sans'>
        We reserve the right to modify this privacy policy at any time. Changes and clarifications 
        will take effect immediately upon their posting on the website. If we make material 
        changes, we will notify you here so that you remain aware of our data protocols.
    </p>
</div>
                {/* Dynamic Sections */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                    {sections.map((section, index) => (
                        <div key={index} className='bg-white p-8 border border-gray-100 shadow-sm rounded-sm hover:shadow-md transition-all'>
                            <div className='flex items-center gap-4 mb-4'>
                                {section.icon}
                                <h3 className='font-black uppercase text-sm tracking-widest'>{section.title}</h3>
                            </div>
                            <p className='text-[13px] text-gray-600 leading-relaxed font-sans'>
                                {section.content}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Detailed Third-Party Section */}
                <div className='bg-white p-10 border border-gray-100 rounded-sm'>
                    <h3 className='font-black uppercase text-sm tracking-widest mb-6 flex items-center gap-3'>
                        <Globe size={20} className="text-[#BC002D]" /> Third-Party Services
                    </h3>
                    <p className='text-[13px] text-gray-600 leading-relaxed font-sans mb-4'>
                        Certain providers, such as payment gateways, have their own privacy policies. We recommend reviewing their protocols to understand how your transaction data is handled, especially if those providers operate in different jurisdictions.
                    </p>
                    <p className='text-[11px] italic text-gray-400 font-sans'>
                        *Once you leave our registry site via a link or redirect, you are no longer governed by this Privacy Policy.
                    </p>
                </div>

                {/* Liability & Contact */}
                <div className='border-t border-gray-200 pt-12 text-center'>
                    <h4 className='font-black uppercase text-[10px] tracking-[0.3em] text-gray-400 mb-6'>Legal Notice & Contact</h4>
                    <p className='text-[12px] text-gray-500 max-w-2xl mx-auto leading-loose mb-8 font-sans'>
                        While we use commercially reasonable efforts to protect your data, we cannot be held liable for consequences of a security breach beyond our control. For corrections or data deletion requests, contact our Compliance Officer.
                    </p>
                    <a 
                        href="mailto:admin@philabasket.com" 
                        className='inline-flex items-center gap-2 bg-black text-white px-8 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-[#BC002D] transition-all'
                    >
                        <Mail size={14} /> Contact Compliance Officer
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Legal;