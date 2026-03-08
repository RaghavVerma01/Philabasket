import React from 'react';
import { ShieldAlert, FileText, RotateCcw, Info } from 'lucide-react';

const Terms = () => {
    return (
        <div className='bg-white min-h-screen pt-24 pb-20 px-6 md:px-16 lg:px-24 select-none animate-fade-in font-sans'>
            
            <div className='max-w-5xl mx-auto'>
                {/* --- USE OF OUR WEBSITE --- */}
                <section className='mb-16'>
                    <h2 className='text-3xl font-bold text-gray-800 mb-8 uppercase tracking-tight'>Terms and Conditions</h2>
                    <p className='text-sm text-gray-600 mb-6'>When you use this website and place orders through it, you agree to:</p>
                    <ul className='space-y-4 text-sm text-gray-600 list-disc pl-5'>
                        <li>Use this website to make enquiries and legally valid orders only.</li>
                        <li>Not to make any false or fraudulent orders. If an order of this type may reasonably be considered to have been placed, we shall be authorised to cancel it and inform the competent authorities.</li>
                        <li>Provide us with your email address, postal address and/or other contact details truthfully and exactly. You also agree that we may use this information to contact you in the context of your order if necessary.</li>
                        <li>If you do not provide us with all the information we need, you cannot place your order.</li>
                    </ul>
                </section>

                {/* --- PRODUCT CONDITION --- */}
                <section className='mb-16'>
                    <div className='flex items-center gap-3 mb-8'>
                        <ShieldAlert size={24} className='text-[#BC002D]' />
                        <h2 className='text-3xl font-bold text-gray-800 uppercase tracking-tight'>PRODUCT CONDITION:</h2>
                    </div>
                    <div className='bg-gray-50 p-8 border border-gray-100 rounded-sm'>
                        <p className='text-sm font-bold text-gray-700 leading-relaxed mb-8'>
                            All Images On The Website Are Referral – Due to multiple quantity listing we cannot change image of thousands of item every time hence the block of stamps having margin in image may have different side margin or no-margin at all, similarly traffic light in blocks of stamps or singe stamp may be present in image but not in the item delivered. all images are only referral except for the items listed in errors/oddities category.
                        </p>
                        
                        <h3 className='text-sm font-bold text-gray-800 mb-6 uppercase tracking-widest'>The condition of the stamps may be defined in following manner:</h3>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-8'>
                            {[
                                { code: 'MNH', desc: 'Mint Never Hinged' },
                                { code: 'MLH', desc: 'Mint Lightly Hinged' },
                                { code: 'MH', desc: 'Mint hinged (Heavy Hinge Mark)' },
                                { code: 'MM', desc: 'Mounted Mint (Stamp is Unused but it’s stuck on a paper)' }
                            ].map((grade) => (
                                <div key={grade.code} className='border border-gray-200 p-4 flex justify-between items-center bg-white'>
                                    <span className='font-black text-[#BC002D]'>{grade.code}</span>
                                    <span className='text-[10px] font-bold text-gray-500 uppercase'>{grade.desc}</span>
                                </div>
                            ))}
                        </div>

                        <div className='space-y-6 text-sm text-gray-600 leading-relaxed'>
                            <p>For all Mint Never hinged stamps, please understand that all stamps are in Excellent Condition from the year 1990 onwards, i.e. all are white gum no mark / spots. Stamps for the period 1957-1988 are mixed in condition i.e. many are white, many are off-white / v. v. light yellow in color this is because of the topicalization of gum side in India due to the climate and old printing technology used. Stamps before 1957, may be tropicalized completely.</p>
                            
                            <p>Regarding FDC, the cancellation on the stamp may differ from image, the position of cancellation, stamps etc. may also differ from image as such the image is only referral and we have multiple quantity listing. Many cancellations today also are hand stamped in philatelic bureaus resulting in slight smudging, all these are general condition nothing related to major damage.</p>
                            
                            <div className='p-5 border-l-4 border-[#BC002D] bg-white italic'>
                                We try to provide the best condition possible, in general our materials are much better in condition than our competitors because we carefully examine each stamp and send you the best available. However, in any case if you are not satisfied by the material’s condition, there is always an option of refund.
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- EXCHANGE --- */}
                <section className='mb-16'>
                    <div className='flex items-center gap-3 mb-8'>
                        <RotateCcw size={24} className='text-[#BC002D]' />
                        <h2 className='text-3xl font-bold text-gray-800 uppercase tracking-tight'>EXCHANGE:</h2>
                    </div>
                    <div className='border-2 border-dashed border-gray-200 p-8 md:p-10'>
                        <p className='text-sm text-gray-700 font-bold uppercase tracking-wide leading-relaxed mb-8'>
                            Once you have bought any material or stamps by mistake and wanted other items in its place, then again you shall need to intimate us via email at <span className='text-[#BC002D] underline'>Admin@philabasket.com</span> within 24 hours of receiving of materials.
                        </p>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
                            <div className='space-y-4'>
                                <p className='text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]'>SHIPPING PROTOCOL</p>
                                <p className='text-xs text-gray-600 font-bold uppercase leading-loose'>Additional shipping charges shall be borne by the buyer and the exchanged material will be sent after receiving the original item for which exchange has been sought.</p>
                            </div>
                            <div className='space-y-4'>
                                <p className='text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]'>SETTLEMENT</p>
                                <p className='text-xs text-gray-600 font-bold uppercase leading-loose'>Any difference in amount while exchanging shall be settled as per the situation and such information shall be communicated via email.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .animate-fade-in { animation: fadeIn 0.8s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}} />
        </div>
    );
};

export default Terms;