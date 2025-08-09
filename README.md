# Minimalist 3D Gallery

A beautiful, minimalist 3D gallery with an abstract quadrilateral layout.

## How to Add Your YouTube Videos

1. **Open `src/App.tsx`**
2. **Replace the sample video URLs** in the `sampleMediaItems` array:

```typescript
const sampleMediaItems = [
  {
    id: '1',
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID_HERE',
    title: 'Your Video Title'
  },
  // Add more videos...
];
```

3. **Supported URL formats:**
   - `https://www.youtube.com/watch?v=VIDEO_ID`
   - `https://youtu.be/VIDEO_ID`
   - Direct video file URLs (mp4, webm, etc.)

## Features

- **Abstract Quadrilateral Layout**: Videos arranged in a compact, geometric pattern
- **Minimalist Design**: Clean white background with subtle gray accents
- **Smooth Interactions**: Hover effects and gentle animations
- **YouTube Integration**: Click to open YouTube videos in new tab
- **Responsive**: Works on desktop and mobile devices

## Customization

- **Change layout density**: Modify the spacing values in `createQuadrilateralPoints()`
- **Adjust colors**: Update the color values in the CSS and Three.js materials
- **Add more videos**: Simply add more items to the `sampleMediaItems` array

## Running the Project

```bash
npm install
npm run dev
```

Then open http://localhost:5173/ in your browser. 