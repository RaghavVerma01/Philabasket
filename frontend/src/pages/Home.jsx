
import React, { useRef } from 'react'
import Hero from '../components/Hero'
import LatestCollection from '../components/LatestCollection'
import BestSeller from '../components/BestSeller'
import OurPolicy from '../components/OurPolicy'
import NewsletterBox from '../components/NewsletterBox'
import NewHero from '../components/NewHero'
import Banner from '../components/Banner'
import FeaturedCategories from '../components/FeaturedCategory'
import Testimonials from '../components/Testimonila'
import StampCategoryScroll from '../components/StampCategoryScroll'

const Home = () => {
  const latestCollectionRef = useRef(null);
  const scrollToCollection = () => {
    latestCollectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <div className='bg-white'>
      {/* 1. THE HOOK: High-impact emotional entrance */}
      {/* <NewHero scrollHandler={scrollToCollection} /> */}
      <Banner scrollHandler={scrollToCollection}/>

      <StampCategoryScroll/>

      <FeaturedCategories/>

      {/* 2. THE DISCOVERY: What is new in the archive today */}
      <div ref={latestCollectionRef}>
        <LatestCollection/>
      </div>

      <BestSeller />



      <NewsletterBox />


      <Testimonials/>


      {/* 3. THE PALATE CLEANSER: Breaks the grid pattern and builds authority/trust 
          This is essential to separate the two different product sections. */}
      <OurPolicy/>

      {/* 4. THE VALIDATION: High-value, most-wanted specimens 
          Placing this after Policy makes the BestSellers feel more 'verified'. */}
      {/* <BestSeller/> */}

      {/* 5. THE CLOSURE: Inviting them into the long-term community */}
      
    </div>
  )
}

export default Home