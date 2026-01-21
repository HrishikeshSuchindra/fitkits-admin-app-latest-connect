import { supabase } from './supabase';

export async function uploadVenuePhoto(
  file: File,
  venueSlug: string,
  photoIndex: number
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${venueSlug}/${photoIndex}-${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from('venue-photos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload photo: ${error.message}`);
  }

  const { data } = supabase.storage
    .from('venue-photos')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function uploadMultipleVenuePhotos(
  files: File[],
  venueSlug: string,
  startIndex: number = 0
): Promise<string[]> {
  const uploadPromises = files.map((file, index) =>
    uploadVenuePhoto(file, venueSlug, startIndex + index)
  );

  return Promise.all(uploadPromises);
}
