import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import config from '../config';
import logger from '../logger';

const { cloud_name, api_key, api_secret } = config.cloudinary;

if (!cloud_name || !api_key || !api_secret) {
  logger.warn(
    'Cloudinary environment variables are missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
  );
}

cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
});

export const uploadToCloudinary = async (filePath: string, folder: string) => {
  if (!filePath) {
    throw new Error('Uploaded file path is missing.');
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`Uploaded file was not found on disk: ${filePath}`);
  }

  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      'Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your environment.',
    );
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto',
    });

    fs.unlinkSync(filePath);

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
    };
  } catch (error: any) {
    logger.error('Cloudinary upload error:', error);
    const message = error?.message || 'Failed to upload file to Cloudinary';
    throw new Error(message);
  }
};

// delete file
export const deleteFromCloudinary = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new Error('Failed to delete file from Cloudinary');
  }
};
