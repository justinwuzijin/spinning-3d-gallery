import React from 'react';
import Gallery3D from './components/Gallery3D';

// Justin's images - 24 items for perfect spherical alignment like the reference
const sampleMediaItems = [
  {
    id: '1',
    type: 'image' as const,
    src: '/images/1.png',
    title: 'Justin\'s Image 1'
  },
  {
    id: '2', 
    type: 'image' as const,
    src: '/images/2.png',
    title: 'Justin\'s Image 2'
  },
  {
    id: '3',
    type: 'image' as const,
    src: '/images/3.png',
    title: 'Justin\'s Image 3'
  },
  {
    id: '4',
    type: 'image' as const,
    src: '/images/4.png',
    title: 'Justin\'s Image 4'
  },
  {
    id: '5',
    type: 'image' as const,
    src: '/images/5.png',
    title: 'Justin\'s Image 5'
  },
  {
    id: '6',
    type: 'image' as const,
    src: '/images/6.png',
    title: 'Justin\'s Image 6'
  },
  {
    id: '7',
    type: 'image' as const,
    src: '/images/7.png',
    title: 'Justin\'s Image 7'
  },
  {
    id: '8',
    type: 'image' as const,
    src: '/images/8.png',
    title: 'Justin\'s Image 8'
  },
  {
    id: '9',
    type: 'image' as const,
    src: '/images/9.png',
    title: 'Justin\'s Image 9'
  },
  {
    id: '10',
    type: 'image' as const,
    src: '/images/10.png',
    title: 'Justin\'s Image 10'
  },
  {
    id: '11',
    type: 'image' as const,
    src: '/images/11.png',
    title: 'Justin\'s Image 11'
  },
  {
    id: '12',
    type: 'image' as const,
    src: '/images/12.png',
    title: 'Justin\'s Image 12'
  },
  {
    id: '13',
    type: 'image' as const,
    src: '/images/13.png',
    title: 'Justin\'s Image 13'
  },
  {
    id: '14',
    type: 'image' as const,
    src: '/images/14.png',
    title: 'Justin\'s Image 14'
  },
  {
    id: '15',
    type: 'image' as const,
    src: '/images/15.png',
    title: 'Justin\'s Image 15'
  },
  {
    id: '16',
    type: 'image' as const,
    src: '/images/16.png',
    title: 'Justin\'s Image 16'
  },
  {
    id: '17',
    type: 'image' as const,
    src: '/images/17.png',
    title: 'Justin\'s Image 17'
  },
  {
    id: '18',
    type: 'image' as const,
    src: '/images/18.png',
    title: 'Justin\'s Image 18'
  },
  {
    id: '19',
    type: 'image' as const,
    src: '/images/19.png',
    title: 'Justin\'s Image 19'
  },
  {
    id: '20',
    type: 'image' as const,
    src: '/images/20.png',
    title: 'Justin\'s Image 20'
  },
  {
    id: '21',
    type: 'image' as const,
    src: '/images/21.png',
    title: 'Justin\'s Image 21'
  },
  {
    id: '22',
    type: 'image' as const,
    src: '/images/22.png',
    title: 'Justin\'s Image 22'
  },
  {
    id: '23',
    type: 'image' as const,
    src: '/images/23.png',
    title: 'Justin\'s Image 23'
  },
  {
    id: '24',
    type: 'image' as const,
    src: '/images/24.png',
    title: 'Justin\'s Image 24'
  }
];

function App() {
  return (
    <div className="w-full h-screen relative overflow-hidden">
      {/* Fluid liquid digital gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 animate-gradient-flow"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-pink-400 via-red-500 to-orange-500 animate-gradient-flow-reverse opacity-60"></div>
      <div className="absolute inset-0 bg-gradient-to-bl from-green-400 via-teal-500 to-cyan-500 animate-gradient-flow-slow opacity-40"></div>
      
      {/* Animated liquid shapes for fluid effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl animate-liquid-float"></div>
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-purple-400/30 to-pink-500/30 rounded-full blur-3xl animate-liquid-float-reverse"></div>
        <div className="absolute bottom-0 left-1/4 w-[700px] h-[700px] bg-gradient-to-tr from-emerald-400/30 to-teal-500/30 rounded-full blur-3xl animate-liquid-float-slow"></div>
        <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-gradient-to-br from-orange-400/30 to-yellow-500/30 rounded-full blur-3xl animate-liquid-float-delayed"></div>
      </div>
      
      {/* Additional flowing gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-flow-horizontal"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/3 to-transparent animate-flow-vertical"></div>
      
      <Gallery3D mediaItems={sampleMediaItems} radius={12} />
    </div>
  );
}

export default App;