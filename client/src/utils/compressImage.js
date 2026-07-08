// Vercel Functions cap the total request body at 4.5MB (confirmed live:
// uploading 4 real phone-camera photos, ~8MB each, returned a raw-text 413
// FUNCTION_PAYLOAD_TOO_LARGE from Vercel's edge — before our own code ever
// ran, and not JSON, so it surfaced to the browser as a generic network
// error). Desktop screenshots are usually small enough already, but real
// camera photos routinely run 3-10MB each, and up to 5 can be uploaded at
// once — so every image is resized/re-encoded client-side before upload,
// not just ones that look "too big".
const MAX_DIMENSION = 2000;
// ~700KB per file comfortably fits 5 files under the 4.5MB total body cap,
// with headroom for multipart boundaries/headers.
const TARGET_MAX_BYTES = 700 * 1024;
const MIN_QUALITY = 0.4;
const QUALITY_STEP = 0.15;

function canvasToBlob(canvas, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

export async function compressImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  let quality = 0.85;
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > TARGET_MAX_BYTES && quality > MIN_QUALITY) {
    quality -= QUALITY_STEP;
    blob = await canvasToBlob(canvas, quality);
  }

  const jpegName = file.name.replace(/\.\w+$/, "") + ".jpg";
  return new File([blob], jpegName, { type: "image/jpeg" });
}

export function compressImages(files) {
  return Promise.all(files.map(compressImage));
}
