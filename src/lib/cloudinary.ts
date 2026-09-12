/**
 * Cloudinary Unsigned Client-Side Upload Utility
 * Allows free document and file uploads without requiring a Firebase Blaze billing account.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

export const isCloudinaryConfigured = Boolean(CLOUD_NAME && UPLOAD_PRESET);

export interface CloudinaryUploadResult {
  url: string;
  publicId?: string;
  bytes: number;
  format?: string;
  originalFilename: string;
}

export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  if (isCloudinaryConfigured) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Cloudinary upload failed with status ${response.status}`
      );
    }

    const data = await response.json();
    return {
      url: data.secure_url || data.url,
      publicId: data.public_id,
      bytes: data.bytes || file.size,
      format: data.format || file.type,
      originalFilename: data.original_filename || file.name,
    };
  }

  // Fallback if Cloudinary keys are not yet configured: convert to Base64 data URL
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

  return {
    url: dataUrl,
    bytes: file.size,
    originalFilename: file.name,
  };
}
