'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Box3D, Share2, Settings, Users, ArrowRight, ExternalLink, FlaskConical, Archive } from 'lucide-react';
import ImageBackground from '../public/sim.png';
import Image from 'next/image';

// Optimized Holographic Background Component
const HolographicBackground = (() => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/50 to-purple-900/50 animate-pulse"></div>
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-700/30 via-transparent to-transparent opacity-50 blur-3xl"></div>
  </div>
));

// Optimized Particle Background
const ParticleBackground = (() => {
  const particles = useMemo(() => {
    const seed = 42; // Use a consistent seed
    return Array.from({ length: 50 }).map((_, index) => ({
      id: index,
      x: (index * 10 + seed) % 100,
      y: (index * 20 + seed) % 100,
      size: (index % 3) + 1,
      delay: (index % 200) / 100,
      duration: (index % 300) / 100 + 2,
    }));
  }, []);  

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ 
            x: `${particle.x}%`, 
            y: `${particle.y}%`, 
            opacity: 0,
            scale: 0.5
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
            x: `${particle.x + (Math.random() * 10 - 5)}%`,
            y: `${particle.y + (Math.random() * 10 - 5)}%`
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute w-1 h-1 bg-blue-400/50 rounded-full"
        />
      ))}
    </div>
  );
});

// Optimized 3D Holographic Image Component
const AdvancedHolographicImage = (() => (
  <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/2 max-w-[600px] aspect-square perspective-1000">
    <motion.div
      initial={{ boxShadow: '0 0 0px 0px rgba(59, 130, 246, 0.3)' }}
      animate={{ 
        boxShadow: [
          '0 0 10px 5px rgba(59, 130, 246, 0.3)',
          '0 0 20px 10px rgba(59, 130, 246, 0.4)',
          '0 0 10px 5px rgba(59, 130, 246, 0.3)'
        ]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="absolute inset-0 rounded-xl"
    />
    <Image 
      height={400} 
      width={400} 
      src="/atom.png" 
      alt="Advanced Chemical Process Simulation" 
      className="w-full h-full object-contain filter brightness-150 contrast-125 saturate-150 hue-rotate-15 mix-blend-screen rounded-xl"
    />
    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 mix-blend-overlay rounded-xl"></div>
  </div>
));

const FeatureCard = (({ icon, title, description }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    viewport={{ once: true }}
    className="bg-slate-700/50 p-6 rounded-xl hover:transform hover:scale-105 transition-all duration-300 group"
  >
    <div className="mb-4 transition-transform group-hover:rotate-12">{icon}</div>
    <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
    <p className="text-gray-300">{description}</p>
  </motion.div>
));

const OptimizedLandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const navigateButton = () => {
    window.location.href = '/demo';
  }

  return (
    <div className="relative min-h-screen bg-slate-900 overflow-hidden">
      <HolographicBackground />
      <ParticleBackground />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto px-6 py-4 relative z-20">
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <Image height={100} width={100} alt='Custom icon' src="/sim.png" />
              <span className="text-2xl font-bold text-white">JINNOVA SIM.IA</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <motion.a 
                href="#features" 
                whileHover={{ scale: 1.1 }}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Features
              </motion.a>
              <motion.a 
                href="#about" 
                whileHover={{ scale: 1.1 }}
                className="text-gray-300 hover:text-white transition-colors"
              >
                About
              </motion.a>
            </div>
          </motion.div>
        </nav>

        {/* Hero Section */}
        <div className="container mx-auto px-6 py-20 relative">
          <AdvancedHolographicImage />
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ 
              opacity: isVisible ? 1 : 0, 
              y: isVisible ? 0 : 50 
            }}
            transition={{ duration: 1 }}
            className="relative z-20"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Revolutionize Chemical Process 
              <span className="text-blue-400 block">Design in 3D</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl">
              Experience chemical engineering like never before with our cutting-edge 3D simulation platform. 
              Design, test, and optimize your processes in real-time with unprecedented accuracy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button 
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 0 15px rgba(59, 130, 246, 0.5)"
                }}
                whileTap={{ scale: 0.95 }}
                onClick={navigateButton} 
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <span>Get Started</span>
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <section className="py-20 bg-slate-800/50 relative">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">Key Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Archive className="w-8 h-8 text-blue-400" />,
                  title: "Real-time 3D Visualization",
                  description: "Experience your chemical processes in stunning 3D with real-time updates and interactive controls."
                },
                {
                  icon: <Share2 className="w-8 h-8 text-blue-400" />,
                  title: "Collaborative Design",
                  description: "Work together with your team in real-time, sharing insights and making decisions faster."
                },
                {
                  icon: <Settings className="w-8 h-8 text-blue-400" />,
                  title: "Advanced Simulation Engine",
                  description: "Powered by cutting-edge algorithms for accurate process modeling and optimization."
                }
              ].map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </div>
        </section>

        {/* Demo Section with Advanced Interaction */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between"
            >
              <div className="mb-8 md:mb-0 md:mr-8">
                <h2 className="text-3xl font-bold text-white mb-4">See It in Action</h2>
                <p className="text-gray-300 mb-6">
                  Watch how JINNOVA SIM.IA transforms complex chemical processes into intuitive 3D visualizations.
                </p>
                <motion.button 
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 0 15px rgba(255, 255, 255, 0.3)"
                  }}
                  className="bg-white text-slate-900 px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-gray-100 transition-colors"
                >
                  <span>Launch Interactive Demo</span>
                  <ExternalLink className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 bg-slate-800/50">
          <div className="container mx-auto px-6 text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-white mb-6"
            >
              Ready to Transform Your Chemical Process Design?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-gray-300 mb-8 max-w-2xl mx-auto"
            >
              Join the next generation of chemical engineers using JINNOVA SIM.IA to innovate and optimize their processes.
            </motion.p>
            <motion.button 
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 0 15px rgba(59, 130, 246, 0.5)"
              }}
              whileTap={{ scale: 0.95 }}
              onClick={navigateButton}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
            >
              <span>Simulator</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 py-12">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <Image height={50} width={50} alt='Custom icon' src={ImageBackground} />
                <span className="text-white font-bold">JINNOVA SIM.IA</span>
              </div>
              <div className="text-gray-400 text-sm">
                © 2024 JINNOVA SIM.IA. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default OptimizedLandingPage;

