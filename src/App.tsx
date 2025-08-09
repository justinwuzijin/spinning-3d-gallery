import React from 'react';
import Gallery3D from './components/Gallery3D';

// Justin's images - 32 items for perfect spherical alignment
const sampleMediaItems = [
  { id: '1', type: 'image' as const, src: '/images/1.png', title: 'Image 1' },
  { id: '2', type: 'image' as const, src: '/images/2.png', title: 'Image 2' },
  { id: '3', type: 'image' as const, src: '/images/3.png', title: 'Image 3' },
  { id: '4', type: 'image' as const, src: '/images/4.png', title: 'Image 4' },
  { id: '5', type: 'image' as const, src: '/images/5.png', title: 'Image 5' },
  { id: '6', type: 'image' as const, src: '/images/6.png', title: 'Image 6' },
  { id: '7', type: 'image' as const, src: '/images/7.png', title: 'Image 7' },
  { id: '8', type: 'image' as const, src: '/images/8.png', title: 'Image 8' },
  { id: '9', type: 'image' as const, src: '/images/9.png', title: 'Image 9' },
  { id: '10', type: 'image' as const, src: '/images/10.png', title: 'Image 10' },
  { id: '11', type: 'image' as const, src: '/images/11.png', title: 'Image 11' },
  { id: '12', type: 'image' as const, src: '/images/12.png', title: 'Image 12' },
  { id: '13', type: 'image' as const, src: '/images/13.png', title: 'Image 13' },
  { id: '14', type: 'image' as const, src: '/images/14.png', title: 'Image 14' },
  { id: '15', type: 'image' as const, src: '/images/15.png', title: 'Image 15' },
  { id: '16', type: 'image' as const, src: '/images/16.png', title: 'Image 16' },
  { id: '17', type: 'image' as const, src: '/images/17.png', title: 'Image 17' },
  { id: '18', type: 'image' as const, src: '/images/18.png', title: 'Image 18' },
  { id: '19', type: 'image' as const, src: '/images/19.png', title: 'Image 19' },
  { id: '20', type: 'image' as const, src: '/images/20.png', title: 'Image 20' },
  { id: '21', type: 'image' as const, src: '/images/21.png', title: 'Image 21' },
  { id: '22', type: 'image' as const, src: '/images/22.png', title: 'Image 22' },
  { id: '23', type: 'image' as const, src: '/images/23.png', title: 'Image 23' },
  { id: '24', type: 'image' as const, src: '/images/24.png', title: 'Image 24' },
  { id: '25', type: 'image' as const, src: '/images/25.png', title: 'Image 25' },
  { id: '26', type: 'image' as const, src: '/images/26.png', title: 'Image 26' },
  { id: '27', type: 'image' as const, src: '/images/27.png', title: 'Image 27' },
  { id: '28', type: 'image' as const, src: '/images/28.png', title: 'Image 28' },
  { id: '29', type: 'image' as const, src: '/images/29.png', title: 'Image 29' },
  { id: '30', type: 'image' as const, src: '/images/30.png', title: 'Image 30' },
  { id: '31', type: 'image' as const, src: '/images/31.png', title: 'Image 31' },
  { id: '32', type: 'image' as const, src: '/images/32.png', title: 'Image 32' }
];

function App() {
  return (
    <div className="w-full h-screen relative overflow-hidden bg-black">
      <Gallery3D mediaItems={sampleMediaItems} radius={15} />
    </div>
  );
}

export default App;