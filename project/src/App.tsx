import React from 'react';
import Gallery3D from './components/Gallery3D';

// Justin's images - 32 items for circular 3D structure using local images
const sampleMediaItems = [
  {
    id: '1',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/1.png ',
    title: 'Justin\'s Image 1'
  },
  {
    id: '2', 
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/2.png',
    title: 'Justin\'s Image 2'
  },
  {
    id: '3',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/3.png',
    title: 'Justin\'s Image 3'
  },
  {
    id: '4',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/4.png',
    title: 'Justin\'s Image 4'
  },
  {
    id: '5',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/5.png',
    title: 'Justin\'s Image 5'
  },
  {
    id: '6',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/6.png',
    title: 'Justin\'s Image 6'
  },
  {
    id: '7',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/7.png',
    title: 'Justin\'s Image 7'
  },
  {
    id: '8',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/8.png',
    title: 'Justin\'s Image 8'
  },
  {
    id: '9',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/9.png',
    title: 'Justin\'s Image 9'
  },
  {
    id: '10',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/10.png',
    title: 'Justin\'s Image 10'
  },
  {
    id: '11',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/11.png',
    title: 'Justin\'s Image 11'
  },
  {
    id: '12',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/12.png',
    title: 'Justin\'s Image 12'
  },
  {
    id: '13',
    type: 'image' as const,
      src: '/Users/justinwu/Desktop/Justin Wu/13.png',
    title: 'Justin\'s Image 13'
  },
  {
    id: '14',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/14.png',
    title: 'Justin\'s Image 14'
  },
  {
    id: '15',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/15.png',
    title: 'Justin\'s Image 15'
  },
  {
    id: '16',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/16.png',
    title: 'Justin\'s Image 16'
  },
  {
    id: '17',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/17.png',
    title: 'Justin\'s Image 17'
  },
  {
    id: '18',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/18.png',
    title: 'Justin\'s Image 18'
  },
  {
    id: '19',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/19.png',
    title: 'Justin\'s Image 19'
  },
  {
    id: '20',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/20.png',
    title: 'Justin\'s Image 20'
  },
  {
    id: '21',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/21.png',
    title: 'Justin\'s Image 21'
  },
  {
    id: '22',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/22.png',
    title: 'Justin\'s Image 22'
  },
  {
    id: '23',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/23.png',
    title: 'Justin\'s Image 23'
  },
  {
    id: '24',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/24.png',
    title: 'Justin\'s Image 24'
  },
  {
    id: '25',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/25.png',
    title: 'Justin\'s Image 25'
  },
  {
    id: '26',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/26.png',
    title: 'Justin\'s Image 26'
  },
  {
    id: '27',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/27.png',
    title: 'Justin\'s Image 27'
  },
  {
    id: '28',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/28.png',
    title: 'Justin\'s Image 28'
  },
  {
    id: '29',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/29.png',
    title: 'Justin\'s Image 29'
  },
  {
    id: '30',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/30.png',
    title: 'Justin\'s Image 30'
  },
  {
    id: '31',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/31.png',
    title: 'Justin\'s Image 31'
  },
  {
    id: '32',
    type: 'image' as const,
    src: '/Users/justinwu/Desktop/Justin Wu/32.png',
    title: 'Justin\'s Image 32'
  }
];

function App() {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Gallery3D mediaItems={sampleMediaItems} radius={8} />
    </div>
  );
}

export default App;