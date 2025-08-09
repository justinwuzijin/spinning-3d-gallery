import React from 'react';
import Gallery3D from './components/Gallery3D';

// Justin's images - 32 items for perfect spherical alignment
const sampleMediaItems = [
  { id: '1', type: 'image' as const, src: '/images/1.png', title: 'senior', videoUrl: 'https://www.youtube.com/watch?v=KiQlnbRIr20' },
  { id: '2', type: 'image' as const, src: '/images/2.png', title: 'senior', videoUrl: 'https://www.youtube.com/watch?v=KiQlnbRIr20' },
  { id: '3', type: 'image' as const, src: '/images/3.png', title: 'senior', videoUrl: 'https://www.youtube.com/watch?v=KiQlnbRIr20' },
  { id: '4', type: 'image' as const, src: '/images/4.png', title: 'senior', videoUrl: 'https://www.youtube.com/watch?v=KiQlnbRIr20' },
  { id: '5', type: 'image' as const, src: '/images/5.png', title: 'senior', videoUrl: 'https://www.youtube.com/watch?v=KiQlnbRIr20' },
  { id: '6', type: 'image' as const, src: '/images/6.png', title: 'senior', videoUrl: 'https://www.youtube.com/watch?v=KiQlnbRIr20' },
  { id: '7', type: 'image' as const, src: '/images/7.png', title: 'senior', videoUrl: 'https://www.youtube.com/watch?v=KiQlnbRIr20' },
  { id: '8', type: 'image' as const, src: '/images/8.png', title: '10 conversations with 10 friends 10 days before graduation', videoUrl: 'https://www.youtube.com/watch?v=wRiCNXoGTMI' },
  { id: '9', type: 'image' as const, src: '/images/9.png', title: '10 conversations with 10 friends 10 days before graduation', videoUrl: 'https://www.youtube.com/watch?v=wRiCNXoGTMI' },
  { id: '10', type: 'image' as const, src: '/images/10.png', title: 'senior year during senioritis', videoUrl: 'https://www.youtube.com/watch?v=p7cLUjnm218' },
  { id: '11', type: 'image' as const, src: '/images/11.png', title: 'senior year during senioritis', videoUrl: 'https://www.youtube.com/watch?v=p7cLUjnm218' },
  { id: '12', type: 'image' as const, src: '/images/12.png', title: 'senior year during senioritis', videoUrl: 'https://www.youtube.com/watch?v=p7cLUjnm218' },
  { id: '13', type: 'image' as const, src: '/images/13.png', title: 'senior year during senioritis', videoUrl: 'https://www.youtube.com/watch?v=p7cLUjnm218' },
  { id: '14', type: 'image' as const, src: '/images/14.png', title: 'senior year during senioritis', videoUrl: 'https://www.youtube.com/watch?v=p7cLUjnm218' },
  { id: '15', type: 'image' as const, src: '/images/15.png', title: 'senior year during senioritis', videoUrl: 'https://www.youtube.com/watch?v=p7cLUjnm218' },
  { id: '16', type: 'image' as const, src: '/images/16.png', title: 'senior year during senioritis', videoUrl: 'https://www.youtube.com/watch?v=p7cLUjnm218' },
  { id: '17', type: 'image' as const, src: '/images/17.png', title: 'senior year before senioritis', videoUrl: 'https://www.youtube.com/watch?v=VBRGAG73wEY' },
  { id: '18', type: 'image' as const, src: '/images/18.png', title: 'senior year during senioritis', videoUrl: 'https://www.youtube.com/watch?v=p7cLUjnm218' },
  { id: '19', type: 'image' as const, src: '/images/19.png', title: 'Image 19' },
  { id: '20', type: 'image' as const, src: '/images/20.png', title: 'Image 20' },
  { id: '21', type: 'image' as const, src: '/images/21.png', title: 'senior year during senioritis', videoUrl: 'https://www.youtube.com/watch?v=p7cLUjnm218' },
  { id: '22', type: 'image' as const, src: '/images/22.png', title: 'senior year during senioritis', videoUrl: 'https://www.youtube.com/watch?v=p7cLUjnm218' },
  { id: '23', type: 'image' as const, src: '/images/23.png', title: 'komorebi', videoUrl: 'https://www.instagram.com/p/DMsfCgzuQX7/?img_index=1' },
  { id: '24', type: 'image' as const, src: '/images/24.png', title: 'senior year before senioritis', videoUrl: 'https://www.youtube.com/watch?v=VBRGAG73wEY' },
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