import { createClient } from '@supabase/supabase-js';
import env from '../config/env.js';

const supabase = createClient(env.supabase.url, env.supabase.serviceRoleKey);

let bucketReady = false;

async function ensureBucket() {
  if (bucketReady) return;

  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('[ERR] Supabase listBuckets failed:', listError.message);
      throw listError;
    }

    const exists = buckets?.some((b) => b.name === env.supabase.bucket);
    if (!exists) {
      const { error: createError } = await supabase.storage.createBucket(
        env.supabase.bucket,
        { public: true }
      );
      if (createError) {
        console.error('[ERR] Supabase createBucket failed:', createError.message);
        throw createError;
      }
      console.log('[LOG] Supabase bucket created:', env.supabase.bucket);
    }

    bucketReady = true;
  } catch (err) {
    console.error('[ERR] Supabase ensureBucket failed:', err.message);
    throw err;
  }
}

async function upload(buffer, { originalName, mimeType }) {
  await ensureBucket();

  const path = `${Date.now()}-${originalName}`;

  const { error: uploadError } = await supabase.storage
    .from(env.supabase.bucket)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (uploadError) {
    console.error('[ERR] Supabase upload failed:', uploadError.message);
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage
    .from(env.supabase.bucket)
    .getPublicUrl(path);

  console.log('[LOG] Supabase upload success:', path);

  return { url: publicUrlData.publicUrl, publicId: path };
}

async function deleteFile(path) {
  const { error } = await supabase.storage.from(env.supabase.bucket).remove([path]);
  if (error) {
    console.error('[ERR] Supabase delete failed:', error.message);
    throw error;
  }
  console.log('[LOG] Supabase file deleted:', path);
}

export default { upload, delete: deleteFile };