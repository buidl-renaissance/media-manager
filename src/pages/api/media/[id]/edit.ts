import { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File } from 'formidable';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db, media } from '@/lib/db';
import { uploadFile, getFileKey } from '@/lib/storage';
import { generateResizedVersions, getFileExtension } from '@/lib/storage/resize';
import { eq } from 'drizzle-orm';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid media ID' });
    }

    // Check if media exists
    const existingMedia = await db
      .select()
      .from(media)
      .where(eq(media.id, id))
      .limit(1);

    if (existingMedia.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    const [fields, files] = await form.parse(req);

    // Extract metadata from form fields
    const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
    const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;
    const altText = Array.isArray(fields.altText) ? fields.altText[0] : fields.altText;
    const tagsString = Array.isArray(fields.tags) ? fields.tags[0] : fields.tags;
    const tags = tagsString ? JSON.parse(tagsString) : [];

    let updateData: {
      title: string | null;
      description: string | null; 
      altText: string | null;
      tags: string[];
      originalUrl?: string;
      mediumUrl?: string;
      thumbnailUrl?: string;
    } = {
      title: title || null,
      description: description || null,
      altText: altText || null,
      tags,
    };

    // Handle edited image if provided
    const editedImageFile = Array.isArray(files.editedImage) ? files.editedImage[0] : files.editedImage;
    
    if (editedImageFile) {
      const imageBuffer = await fs.readFile(editedImageFile.filepath);
      const fileExtension = getFileExtension(editedImageFile.originalFilename || 'edited.jpg');
      
      // Generate new file keys for the edited image  
      const editedKey = `${id}/edited.${fileExtension}`;
      
      // Upload the edited original
      const editedUpload = await uploadFile(
        imageBuffer,
        editedKey,
        editedImageFile.mimetype || 'image/jpeg'
      );

      // Generate new resized versions from the edited image
      const { medium, thumb } = await generateResizedVersions(imageBuffer);

      // Upload new resized versions
      const [editedMediumUpload, editedThumbUpload] = await Promise.all([
        uploadFile(
          medium,
          `${id}/edited-medium.${fileExtension}`,
          editedImageFile.mimetype || 'image/jpeg'
        ),
        uploadFile(
          thumb,
          `${id}/edited-thumb.${fileExtension}`,
          editedImageFile.mimetype || 'image/jpeg'
        ),
      ]);

      // Update URLs to point to edited versions
      updateData = {
        ...updateData,
        originalUrl: editedUpload.url,
        mediumUrl: editedMediumUpload.url,
        thumbnailUrl: editedThumbUpload.url,
      };

      // Clean up temporary file
      await fs.unlink(editedImageFile.filepath).catch(() => {});
    }

    // Update the database record
    const updatedMedia = await db
      .update(media)
      .set(updateData)
      .where(eq(media.id, id))
      .returning();

    res.status(200).json({
      success: true,
      media: updatedMedia[0],
    });
  } catch (error) {
    console.error('Edit error:', error);
    res.status(500).json({
      error: 'Edit failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 