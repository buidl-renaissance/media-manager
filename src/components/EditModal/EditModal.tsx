import React, { useState, useRef, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface MediaItem {
  id: string;
  originalUrl: string;
  mediumUrl: string | null;
  thumbnailUrl: string | null;
  source: string;
  tags: string[];
  title: string | null;
  description: string | null;
  altText: string | null;
  createdAt: Date;
}

interface EditModalProps {
  media: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedMedia: Partial<MediaItem>) => void;
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(13, 17, 23, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const Modal = styled.div`
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  width: 100%;
  max-width: 1000px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.6);
`;

const ImageSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 500px;
`;

const ImageContainer = styled.div`
  flex: 1;
  position: relative;
  background: #0d1117;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const ImageControls = styled.div`
  padding: 16px;
  background: #161b22;
  border-top: 1px solid #30363d;
  display: flex;
  gap: 12px;
  align-items: center;
`;

const FormSection = styled.div`
  width: 350px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #30363d;
`;

const FormHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #30363d;
  
  h2 {
    margin: 0;
    color: #f0f6fc;
    font-size: 18px;
    font-weight: 600;
  }
`;

const FormContent = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

const FormActions = styled.div`
  padding: 20px;
  border-top: 1px solid #30363d;
  display: flex;
  gap: 12px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  
  label {
    display: block;
    color: #f0f6fc;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 6px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  color: #f0f6fc;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #58a6ff;
    box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  color: #f0f6fc;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
  
  &:focus {
    outline: none;
    border-color: #58a6ff;
    box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1);
  }
`;

const TagsInput = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  min-height: 40px;
`;

const Tag = styled.span`
  background: #1f6feb;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const TagRemove = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid;
  transition: all 0.2s ease;
  
  ${props => props.variant === 'primary' ? `
    background: #238636;
    color: white;
    border-color: #238636;
    
    &:hover {
      background: #2ea043;
      border-color: #2ea043;
    }
  ` : `
    background: #21262d;
    color: #f0f6fc;
    border-color: #30363d;
    
    &:hover {
      background: #30363d;
      border-color: #8b949e;
    }
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ControlButton = styled.button`
  padding: 8px 12px;
  background: #21262d;
  color: #f0f6fc;
  border: 1px solid #30363d;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #30363d;
    border-color: #8b949e;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  color: #8b949e;
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    color: #f0f6fc;
    background: rgba(255, 255, 255, 0.1);
  }
`;

export const EditModal: React.FC<EditModalProps> = ({ media, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    altText: '',
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize form data when media changes
  useEffect(() => {
    if (media) {
      setFormData({
        title: media.title || '',
        description: media.description || '',
        altText: media.altText || '',
        tags: media.tags || [],
      });
      setRotation(0);
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }, [media]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRotate = (degrees: number) => {
    setRotation(prev => (prev + degrees) % 360);
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop({
      unit: '%',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
  }, []);

  const generateCroppedImage = useCallback(async (): Promise<Blob | null> => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      return null;
    }

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    // Apply rotation
    if (rotation !== 0) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.9);
    });
  }, [completedCrop, rotation]);

  const handleSave = async () => {
    if (!media) return;

    setIsLoading(true);

    try {
      let editedImageData = null;

      // Generate edited image if there are crops or rotation
      if ((completedCrop && (completedCrop.width !== 100 || completedCrop.height !== 100)) || rotation !== 0) {
        const croppedBlob = await generateCroppedImage();
        if (croppedBlob) {
          editedImageData = croppedBlob;
        }
      }

      // Save metadata and edited image
      const updateData = {
        ...formData,
        editedImage: editedImageData,
      };

      await onSave(updateData);
      onClose();
    } catch (error) {
      console.error('Error saving edits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !media) return null;

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Modal>
        <CloseButton onClick={onClose}>×</CloseButton>
        
        <ImageSection>
          <ImageContainer>
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={undefined}
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <img
                ref={imgRef}
                src={media.originalUrl}
                alt={media.altText || 'Edit image'}
                onLoad={onImageLoad}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
            </ReactCrop>
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />
          </ImageContainer>
          
          <ImageControls>
            <ControlButton onClick={() => handleRotate(-90)}>
              ↺ Rotate Left
            </ControlButton>
            <ControlButton onClick={() => handleRotate(90)}>
              ↻ Rotate Right
            </ControlButton>
            <ControlButton onClick={() => setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 })}>
              Reset Crop
            </ControlButton>
            <ControlButton onClick={() => setRotation(0)}>
              Reset Rotation
            </ControlButton>
          </ImageControls>
        </ImageSection>

        <FormSection>
          <FormHeader>
            <h2>Edit Media</h2>
          </FormHeader>

          <FormContent>
            <FormGroup>
              <label htmlFor="title">Title</label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter image title..."
              />
            </FormGroup>

            <FormGroup>
              <label htmlFor="description">Description</label>
              <TextArea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter image description..."
              />
            </FormGroup>

            <FormGroup>
              <label htmlFor="altText">Alt Text</label>
              <TextArea
                id="altText"
                value={formData.altText}
                onChange={(e) => handleInputChange('altText', e.target.value)}
                placeholder="Enter accessibility text..."
              />
            </FormGroup>

            <FormGroup>
              <label htmlFor="tags">Tags</label>
              <TagsInput>
                {formData.tags.map((tag, index) => (
                  <Tag key={index}>
                    {tag}
                    <TagRemove onClick={() => handleRemoveTag(tag)}>×</TagRemove>
                  </Tag>
                ))}
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  onBlur={handleAddTag}
                  placeholder="Add tag..."
                  style={{ 
                    border: 'none', 
                    background: 'transparent', 
                    flex: '1',
                    minWidth: '100px'
                  }}
                />
              </TagsInput>
            </FormGroup>
          </FormContent>

          <FormActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button 
              variant="primary" 
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </FormActions>
        </FormSection>
      </Modal>
    </Overlay>
  );
}; 