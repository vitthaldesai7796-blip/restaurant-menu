import { supabase, IMAGE_BUCKET } from './supabase'

export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

export function formatINR(value) {
  const n = Number(value) || 0
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n)
}

export function mapsLink(settings) {
  if (!settings) return null
  if (settings.maps_url) return settings.maps_url
  if (settings.address) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`
  return null
}

export const isHttpUrl = (v) => /^https?:\/\/\S+\.\S+/i.test(v)

/** Supabase returns no error when RLS blocks an update/delete - it just affects 0 rows. Catch that. */
export function unwrap({ data, error }) {
  if (error) throw new Error(error.message)
  if (Array.isArray(data) && data.length === 0) {
    throw new Error('Not allowed or nothing changed. Make sure you are signed in as an administrator.')
  }
  return data
}

async function toBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

/** Resize + compress an image in the browser before upload (keeps pages fast and storage small). */
export async function compressImage(file, { maxSize = 1200, quality = 0.82 } = {}) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file (JPG, PNG or WebP).')
  if (file.size > 15 * 1024 * 1024) throw new Error('Image is too large. Please choose one under 15 MB.')
  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('This image format is not supported. Please use JPG, PNG or WebP.')
  }
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  let blob = await toBlob(canvas, 'image/webp', quality)
  if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', quality)
  if (!blob) throw new Error('Could not process the image.')
  return blob
}

export async function uploadImage(file, folder, maxSize = 1200) {
  const blob = await compressImage(file, { maxSize })
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${folder}/${uid()}.${ext}`
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false })
  if (error) throw new Error(`Image upload failed: ${error.message}`)
  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl
}

export async function deleteImage(url) {
  if (!url) return
  const marker = `/${IMAGE_BUCKET}/`
  const i = url.indexOf(marker)
  if (i === -1) return
  const path = decodeURIComponent(url.slice(i + marker.length).split('?')[0])
  try { await supabase.storage.from(IMAGE_BUCKET).remove([path]) } catch { /* best effort */ }
}
