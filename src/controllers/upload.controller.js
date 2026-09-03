import Image from '../models/Image.js';
import uploadService from '../services/upload.service.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

// ── POST /api/upload ─────────────────────────────────────────
export const uploadImage = asyncHandler(async (req, res) => {
  const { provider } = req.body;

  if (!provider) {
    throw new AppError('Provider is required', 400);
  }

  if (!req.file) {
    throw new AppError('Image file is required', 400);
  }

  const service = uploadService.getProvider(provider);

  let uploadResult;
  try {
    uploadResult = await service.upload(req.file.buffer, {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    });
  } catch (err) {
    console.error('[ERR] Upload to provider failed:', err.message);
    throw new AppError('Failed to upload image to storage provider', 502);
  }

  let image;
  try {
    image = await Image.create({
      userId: req.user._id,
      originalName: req.file.originalname,
      provider,
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (err) {
    console.error('[ERR] Failed to save image doc, attempting rollback delete:', err.message);
    try {
      await service.delete(uploadResult.publicId);
      console.log('[LOG] Rollback delete succeeded for:', uploadResult.publicId);
    } catch (deleteErr) {
      console.error('[ERR] Rollback delete failed:', deleteErr.message);
    }
    throw new AppError('Failed to save image record', 500);
  }

  console.log('[LOG] Image uploaded and saved:', image._id);

  res.status(201).json({ image });
});

// ── GET /api/upload ────────────────────────────────────────────
export const listImages = asyncHandler(async (req, res) => {
  const images = await Image.find({ userId: req.user._id }).sort({ createdAt: -1 });

  console.log('[LOG] Listed images for user:', req.user._id, '- count:', images.length);

  res.status(200).json({ images });
});

// ── DELETE /api/upload/:id ─────────────────────────────────────
export const deleteImage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const image = await Image.findById(id);
  if (!image) {
    console.warn('[WARN] Delete attempted on nonexistent image:', id);
    throw new AppError('Image not found', 404);
  }

  if (image.userId.toString() !== req.user._id.toString()) {
    console.warn('[WARN] Ownership violation on delete attempt:', {
      imageId: id,
      owner: image.userId,
      requester: req.user._id,
    });
    throw new AppError('You do not have permission to delete this image', 403);
  }

  const service = uploadService.getProvider(image.provider);

  try {
    await service.delete(image.publicId);
  } catch (err) {
    console.error('[ERR] Provider delete failed, proceeding to remove DB record anyway:', err.message);
  }

  await image.deleteOne();

  console.log('[LOG] Image deleted:', id);

  res.status(204).send();
});