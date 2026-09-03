import ImageKit from 'imagekit';
import env from '../config/env.js';

const imagekit = new ImageKit({
  publicKey: env.imagekit.publicKey,
  privateKey: env.imagekit.privateKey,
  urlEndpoint: env.imagekit.urlEndpoint,
});

async function upload(buffer, { originalName }) {
  try {
    const result = await imagekit.upload({
      file: buffer,
      fileName: originalName,
      folder: env.imagekit.folder,
    });
    console.log('[LOG] ImageKit upload success:', result.fileId);
    return { url: result.url, publicId: result.fileId };
  } catch (err) {
    console.error('[ERR] ImageKit upload failed:', err.message);
    throw err;
  }
}

async function deleteFile(fileId) {
  try {
    await imagekit.deleteFile(fileId);
    console.log('[LOG] ImageKit file deleted:', fileId);
  } catch (err) {
    console.error('[ERR] ImageKit delete failed:', err.message);
    throw err;
  }
}

export default { upload, delete: deleteFile };