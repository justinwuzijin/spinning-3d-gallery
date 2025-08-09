# Adding Images to Your Gallery

## How to Replace Videos with Images

1. **Place your images in the `public/images/` folder**
   - Copy your image files to: `project/public/images/`
   - Supported formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`

2. **Update the image paths in `src/App.tsx`**
   - Open `project/src/App.tsx`
   - Replace the placeholder paths with your actual image filenames
   - Example:
     ```typescript
     {
       id: '1',
       type: 'image' as const,
       src: '/images/your-actual-image-1.jpg', // Replace with your filename
       title: 'Your Image Title'
     }
     ```

3. **Image Requirements**
   - Recommended size: 800x600 or larger
   - Aspect ratio: 16:9 or 4:3 works best
   - File size: Keep under 2MB for optimal loading

4. **Current Placeholder Structure**
   ```typescript
   const sampleMediaItems = [
     {
       id: '1',
       type: 'image' as const,
       src: '/images/image1.jpg', // ← Replace this
       title: 'image 1' // ← Replace this
     },
     // ... more images
   ];
   ```

## Quick Steps:
1. Copy your images to `project/public/images/`
2. Update the `src` paths in `src/App.tsx` to match your filenames
3. Update the `title` fields with meaningful names
4. Run `npm run dev` to see your images in the gallery!

## Example:
If you have an image called `my-photo.jpg`, update the first item to:
```typescript
{
  id: '1',
  type: 'image' as const,
  src: '/images/my-photo.jpg',
  title: 'My Photo'
}
``` 