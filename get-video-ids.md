# How to Get Your YouTube Video IDs

To replace the placeholder video IDs with your actual videos from @byjustinwu:

## Method 1: From YouTube URLs
1. Go to your YouTube channel: https://www.youtube.com/@byjustinwu
2. Click on any video
3. Copy the URL - it will look like: `https://www.youtube.com/watch?v=VIDEO_ID_HERE`
4. The part after `v=` is your video ID

## Method 2: From Video Page
1. Open any of your videos
2. Look at the URL in your browser
3. The video ID is the 11-character string after `watch?v=`

## Example:
- URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- Video ID: `dQw4w9WgXcQ`

## Update App.tsx:
Replace the placeholder IDs in `src/App.tsx`:

```typescript
const sampleMediaItems = [
  {
    id: '1',
    type: 'video' as const,
    src: 'https://www.youtube.com/watch?v=YOUR_ACTUAL_VIDEO_ID_1',
    title: 'byjustinwu'
  },
  // ... add more videos
];
```

## Recommended Videos to Include:
Based on your Google Drive folder, you have many great videos! Pick your 8 best/favorite ones and add their IDs here. 