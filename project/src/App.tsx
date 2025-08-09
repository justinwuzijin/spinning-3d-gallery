import React from 'react';
import Gallery3D from './components/Gallery3D';

// Sample media items - replace with your YouTube video links
const sampleMediaItems = [
  {
    id: '1',
    type: 'video' as const,
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    title: 'Big Buck Bunny'
  },
  {
    id: '2', 
    type: 'video' as const,
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    title: 'Elephants Dream'
  },
  {
    id: '3',
    type: 'video' as const,
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    title: 'For Bigger Blazes'
  },
  {
    id: '4',
    type: 'video' as const,
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    title: 'For Bigger Escapes'
  },
  {
    id: '5',
    type: 'video' as const,
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    title: 'For Bigger Fun'
  },
  {
    id: '6',
    type: 'video' as const,
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    title: 'For Bigger Joyrides'
  },
  {
    id: '7',
    type: 'video' as const,
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    title: 'Sintel'
  },
  {
    id: '8',
    type: 'image' as const,
    src: 'https://images.pexels.com/photos/6985001/pexels-photo-6985001.jpeg',
    title: 'Tech Background'
  },
  {
    id: '9',
    type: 'image' as const,
    src: 'https://images.pexels.com/photos/577585/pexels-photo-577585.jpeg',
    title: 'Digital Art'
  },
  {
    id: '10',
    type: 'image' as const,
    src: 'https://images.pexels.com/photos/1089438/pexels-photo-1089438.jpeg',
    title: 'Space Scene'
  }
];

function App() {
  return (
    <div className="w-full h-screen">
      <Gallery3D mediaItems={sampleMediaItems} radius={10} />
    </div>
  );
}

export default App;