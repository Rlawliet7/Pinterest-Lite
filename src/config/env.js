import 'dotenv/config';

function required(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[ERR] Missing required environment variable: ${key}`);
  }
  return value;
}

const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodbUri: required('MONGODB_URI'),

  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '7d',

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'image-manager',
  },

  imagekit: {
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
    folder: process.env.IMAGEKIT_FOLDER || '/image-manager',
  },

  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    bucket: process.env.SUPABASE_BUCKET || 'images',
  },
};

// Ensure at least one storage provider is configured
const hasCloudinary = env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret;
const hasImagekit = env.imagekit.publicKey && env.imagekit.privateKey && env.imagekit.urlEndpoint;
const hasSupabase = env.supabase.url && env.supabase.serviceRoleKey;

if (!hasCloudinary && !hasImagekit && !hasSupabase) {
  console.warn(
    '[env] Warning: No storage provider is fully configured yet. ' +
    'Upload endpoints will fail until at least one of Cloudinary, ImageKit, or Supabase is set up in .env'
  );
}

export default env;