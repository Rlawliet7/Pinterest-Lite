import { v2 as cloudinary } from 'cloudinary';
import env from '../config/env.js';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

function upload(buffer, { originalName, mimeType }) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: env.cloudinary.folder,
      },
      (err, result) => {
        if (err) {
          console.error('[ERR] Cloudinary upload failed:', err.message);
          return reject(err);
        }
        console.log('[LOG] Cloudinary upload success:', result.public_id);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

async function deleteFile(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log('[LOG] Cloudinary file deleted:', publicId);
  } catch (err) {
    console.error('[ERR] Cloudinary delete failed:', err.message);
    throw err;
  }
}

export default { upload, delete: deleteFile };