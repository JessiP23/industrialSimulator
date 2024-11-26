'use client'
import React, { useState, useEffect } from 'react';
import { ChevronRight, Box3D, Share2, Settings, Users, ArrowRight, ExternalLink, FlaskConical, Archive } from 'lucide-react';
import Image from 'next/image';
import ImageBackground from '../public/sim.png'

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);

  const navigateButton = () => {
    window.location.href = '/demo';
  }

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Hero Section */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image height={100} width={100} alt='Custom icon' src={ImageBackground} />
            <span className="text-2xl font-bold text-white">JINNOVA SIM.IA</span>
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
          </div>
          
        </div>
      </nav>

      <div className="container mx-auto px-6 py-20">
        <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Revolutionize Chemical Process Design
            <span className="text-blue-400"> in 3D</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl">
            Experience chemical engineering like never before with our cutting-edge 3D simulation platform. 
            Design, test, and optimize your processes in real-time with unprecedented accuracy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={navigateButton} className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors">
              <span>Get Started</span>
              <ChevronRight className="w-5 h-5" />
            </button>
            {/* <button className="border border-gray-500 hover:border-gray-400 text-white px-8 py-3 rounded-lg transition-colors">
              Watch Demo
            </button> */}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-slate-800/50">
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
              <div key={index} className="bg-slate-700/50 p-6 rounded-xl hover:transform hover:scale-105 transition-all duration-300">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between">
            <div className="mb-8 md:mb-0 md:mr-8">
              <h2 className="text-3xl font-bold text-white mb-4">See It in Action</h2>
              <p className="text-gray-300 mb-6">
                Watch how ChemSim3D transforms complex chemical processes into intuitive 3D visualizations.
              </p>
              <button className="bg-white text-slate-900 px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-gray-100 transition-colors">
                <span>Launch Interactive Demo</span>
                <ExternalLink className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-slate-800/50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Transform Your Chemical Process Design?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join the next generation of chemical engineers using ChemSim3D to innovate and optimize their processes.
          </p>
          <button onClick={navigateButton} className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors">
            <span>Simulator</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <FlaskConical className="h-6 w-6 text-blue-400" />
              <span className="text-white font-bold">ChemSim3D</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2024 ChemSim3D. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;