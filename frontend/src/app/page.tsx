'use client';

import React from 'react';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import LiveDemo from '@/components/landing/LiveDemo';
import SampleQueries from '@/components/landing/SampleQueries';
import TechStack from '@/components/landing/TechStack';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-bg-base text-text-primary">
      {/* Dynamic background accent orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-3xl pointer-events-none -z-10" />
      
      {/* Top Navbar */}
      <Navbar />

      {/* Main Sections */}
      <main className="flex-grow pt-16">
        <Hero />
        
        <div id="features">
          <Features />
        </div>

        <div id="how-it-works">
          <HowItWorks />
        </div>

        <div id="demo">
          <LiveDemo />
        </div>

        <SampleQueries />
        
        <TechStack />
        
        <CTASection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
