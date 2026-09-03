import cloudinaryService from './cloudinary.service.js';
import imagekitService from './imagekit.service.js';
import supabaseService from './supabase.service.js';
import AppError from '../utils/AppError.js';

const providers = {
  cloudinary: cloudinaryService,
  imagekit: imagekitService,
  supabase: supabaseService,
};

function getProvider(name) {
  const provider = providers[name];
  if (!provider) {
    console.warn('[WARN] Unknown storage provider requested:', name);
    throw new AppError(`Unknown storage provider: ${name}`, 400);
  }
  return provider;
}

export default { getProvider };