import React from 'react';
import Gallery3D from './components/Gallery3D';

// Justin's images - 24 items for perfect spherical alignment like the reference
const sampleMediaItems = [
  {
    id: '1',
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=KiQlnbRIr20',
    title: 'senior',
    prompt: '🎬 Click to watch the full senior year journey!'
  },
  {
    id: '2', 
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=KiQlnbRIr20',
    title: 'senior',
    prompt: '🎬 Click to watch the full senior year journey!'
  },
  {
    id: '3',
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=KiQlnbRIr20',
    title: 'senior',
    prompt: '🎬 Click to watch the full senior year journey!'
  },
  {
    id: '4',
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=KiQlnbRIr20',
    title: 'senior',
    prompt: '🎬 Click to watch the full senior year journey!'
  },
  {
    id: '5',
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=KiQlnbRIr20',
    title: 'senior',
    prompt: '🎬 Click to watch the full senior year journey!'
  },
  {
    id: '6',
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=KiQlnbRIr20',
    title: 'senior',
    prompt: '🎬 Click to watch the full senior year journey!'
  },
  {
    id: '7',
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=KiQlnbRIr20',
    title: 'senior',
    prompt: '🎬 Click to watch the full senior year journey!'
  },
  {
    id: '8',
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=wRiCNXoGTMI',
    title: '10 conversations with 10 friends 10 days before graduation',
    prompt: '💬 Click to hear the real conversations before graduation!'
  },
  {
    id: '9',
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=wRiCNXoGTMI',
    title: '10 conversations with 10 friends 10 days before graduation',
    prompt: '💬 Click to hear the real conversations before graduation!'
  },
  {
    id: '10',
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=p7cLUjnm218',
    title: 'senior year during senioritis',
    prompt: '😴 Click to see what senioritis really looks like!'
  },
  {
    id: '11',
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=p7cLUjnm218',
    title: 'senior year during senioritis',
    prompt: '😴 Click to see what senioritis really looks like!'
  },
  {
    id: '12',
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=p7cLUjnm218',
    title: 'senior year during senioritis',
    prompt: '😴 Click to see what senioritis really looks like!'
  },
  {
    id: '13',
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=p7cLUjnm218',
    title: 'senior year during senioritis',
    prompt: '😴 Click to see what senioritis really looks like!'
  },
  {
    id: '14',
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=p7cLUjnm218',
    title: 'senior year during senioritis',
    prompt: '😴 Click to see what senioritis really looks like!'
  },
  {
    id: '15',
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=p7cLUjnm218',
    title: 'senior year during senioritis',
    prompt: '😴 Click to see what senioritis really looks like!'
  },
  {
    id: '16',
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=p7cLUjnm218',
    title: 'senior year during senioritis',
    prompt: '😴 Click to see what senioritis really looks like!'
  },
  {
    id: '17',
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=VBRGAG73wEY',
    title: 'senior year before senioritis',
    prompt: '⚡ Click to see the energy before senioritis hit!'
  },
  {
    id: '18',
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=p7cLUjnm218',
    title: 'senior year during senioritis',
    prompt: '😴 Click to see what senioritis really looks like!'
  },
  {
    id: '19',
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=p7cLUjnm218',
    title: 'senior year during senioritis',
    prompt: '😴 Click to see what senioritis really looks like!'
  },
  {
    id: '20',
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=p7cLUjnm218',
    title: 'senior year during senioritis',
    prompt: '😴 Click to see what senioritis really looks like!'
  },
  {
    id: '21',
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=p7cLUjnm218',
    title: 'senior year during senioritis',
    prompt: '😴 Click to see what senioritis really looks like!'
  },
  {
    id: '22',
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=p7cLUjnm218',
    title: 'senior year during senioritis',
    prompt: '😴 Click to see what senioritis really looks like!'
  },
  {
    id: '23',
    type: 'video' as const,
    src: 'https://www.instagram.com/p/DMsfCgzuQX7/?img_index=1',
    title: 'komorebi',
    prompt: '🌳 Click to experience the peaceful komorebi moment!'
  },
  {
    id: '24',
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=VBRGAG73wEY',
    title: 'senior year before senioritis',
    prompt: '⚡ Click to see the energy before senioritis hit!'
  }
];

function App() {
  return (
    <div className="w-full h-screen relative overflow-hidden">
      <Gallery3D mediaItems={sampleMediaItems} radius={12} />
    </div>
  );
}

export default App;